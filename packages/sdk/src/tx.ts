import { encodeFunctionData, erc20Abi, getAddress, maxUint256, type Address, type Hex } from "viem"
import { coreAbi } from "./abis/core.js"
import { ledgerAbi } from "./abis/ledger.js"
import { USDC_DECIMALS, USE_GLOBAL_SHORTFALL } from "./constants.js"
import type { Context } from "./context.js"
import { BasedLoansError } from "./errors.js"
import { readTokenMeta } from "./markets.js"
import { getProtocolParams, resolveTerm } from "./protocol.js"
import { quoteBorrow } from "./quote.js"
import type { TransactionPlan, UnsignedTransaction } from "./types.js"
import { fromRaw, toRaw, type AmountInput } from "./units.js"

/**
 * The attribution suffix only goes on Based Loans contract calls. Token approvals are sent to
 * third-party ERC-20s, some of which reject calldata longer than expected.
 */
function tx(ctx: Context, to: Address, data: Hex, description: string, attribute = true): UnsignedTransaction {
  const suffix = attribute && ctx.dataSuffix ? (ctx.dataSuffix.slice(2) as string) : ""
  return { chainId: ctx.chainId, to, data: `${data}${suffix}` as Hex, value: "0", description }
}

/** Adds an approve step when the current allowance is below `amount`. Exact-amount approvals by default. */
async function approvalStep(
  ctx: Context,
  token: Address,
  owner: Address | undefined,
  spender: Address,
  amount: bigint,
  label: string,
  unlimited = false,
): Promise<UnsignedTransaction | null> {
  if (owner) {
    const current = await ctx.client.readContract({ address: token, abi: erc20Abi, functionName: "allowance", args: [owner, spender] })
    if (current >= amount) return null
  }
  const value = unlimited ? maxUint256 : amount
  return tx(
    ctx,
    token,
    encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [spender, value] }),
    `Approve ${unlimited ? "unlimited" : label} for Based Loans to use.`,
    false,
  )
}

async function balanceCheck(ctx: Context, token: Address, owner: Address | undefined, amount: bigint, label: string, warnings: string[]) {
  if (!owner) return
  const bal = await ctx.client.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [owner] })
  if (bal < amount) warnings.push(`Wallet holds less than ${label}. The transaction would fail.`)
}

// ─── Borrowing ────────────────────────────────────────────────────────────────

export interface BuildBorrowInput {
  asset: Address
  collateralAmount: AmountInput
  loanAmountUsdc?: AmountInput
  term: number | string
  /** The wallet that will sign. Used to skip unneeded approvals and check balances. */
  borrower?: Address
  /**
   * Max acceptable gap between requested and funded amount, in basis points. Must be at most the
   * protocol default. Omit to use the protocol default. 0 means exact fill only.
   */
  maxShortfallBps?: number
  /** Approve unlimited collateral instead of the exact amount. Default false. */
  unlimitedApproval?: boolean
}

export async function buildBorrow(ctx: Context, input: BuildBorrowInput): Promise<TransactionPlan & { quote: Awaited<ReturnType<typeof quoteBorrow>> }> {
  const quote = await quoteBorrow(ctx, input)
  if (quote.wouldFail) throw new BasedLoansError(`Not building this loan: ${quote.wouldFail}`, "LOAN_WOULD_FAIL")
  const [c, params, meta] = await Promise.all([ctx.contracts(), getProtocolParams(ctx), readTokenMeta(ctx, getAddress(input.asset))])
  const term = resolveTerm(params.terms, input.term)
  const collateral = toRaw(input.collateralAmount, meta.decimals)
  const requested = input.loanAmountUsdc != null ? toRaw(input.loanAmountUsdc, USDC_DECIMALS) : 0n
  const shortfall = input.maxShortfallBps ?? USE_GLOBAL_SHORTFALL
  if (input.maxShortfallBps != null && (input.maxShortfallBps < 0 || input.maxShortfallBps > params.defaultMaxShortfallBps)) {
    throw new BasedLoansError(`maxShortfallBps must be between 0 and ${params.defaultMaxShortfallBps}.`, "INVALID_SHORTFALL")
  }

  const warnings = [...quote.warnings]
  await balanceCheck(ctx, quote.asset, input.borrower, collateral, `${fromRaw(collateral, meta.decimals)} ${meta.symbol}`, warnings)

  const steps: UnsignedTransaction[] = []
  // openLoan pulls only the collateral it uses, but approve the offered amount (it is the cap).
  const approve = await approvalStep(ctx, quote.asset, input.borrower, c.core, collateral, `${fromRaw(collateral, meta.decimals)} ${meta.symbol}`, input.unlimitedApproval)
  if (approve) steps.push(approve)
  steps.push(
    tx(
      ctx,
      c.core,
      encodeFunctionData({
        abi: coreAbi,
        functionName: "openLoan",
        args: [quote.asset, collateral, requested, term.index, BigInt(shortfall), []],
      }),
      `Borrow about ${quote.youReceiveUsdc} USDC against ${quote.collateralUsed} ${meta.symbol} for ${term.durationDays} days. Buy it back for ${quote.buybackCostUsdc} USDC by ${quote.estimatedDueDate.slice(0, 10)}.`,
    ),
  )
  warnings.push(
    "No liquidation: if you do not buy the collateral back by the due date, you keep the USDC and lenders keep the collateral.",
  )
  return {
    steps,
    summary: `Borrow ${quote.youReceiveUsdc} USDC (after a ${quote.feeUsdc} USDC fee) against ${quote.collateralUsed} ${meta.symbol}.`,
    warnings,
    quote,
  }
}

export interface BuildBuybackInput {
  loanId: bigint | number | string
  /** USDC to pay. Omit to pay everything left and get all collateral back. */
  paymentUsdc?: AmountInput
  borrower?: Address
}

export async function buildBuyback(ctx: Context, input: BuildBuybackInput): Promise<TransactionPlan> {
  const c = await ctx.contracts()
  const id = BigInt(input.loanId)
  const [loan, ledger, block] = await Promise.all([
    ctx.client.readContract({ address: c.core, abi: coreAbi, functionName: "getLoan", args: [id] }),
    ctx.client.readContract({ address: c.core, abi: coreAbi, functionName: "getLoanLedger", args: [id] }),
    ctx.client.getBlock(),
  ])
  const [borrower, asset, , collateralRemaining, , buybackPrice, buybackRemaining, , expiry, active] = loan
  if (!active) throw new BasedLoansError(`Loan ${id} is not active.`, "LOAN_INACTIVE")
  if (block.timestamp > BigInt(expiry)) throw new BasedLoansError(`Loan ${id} is past its due date. Collateral can no longer be bought back.`, "LOAN_EXPIRED")
  if (input.borrower && input.borrower.toLowerCase() !== borrower.toLowerCase()) {
    throw new BasedLoansError(`Only the borrower ${borrower} can buy back loan ${id}.`, "NOT_BORROWER")
  }
  const payment = input.paymentUsdc != null ? toRaw(input.paymentUsdc, USDC_DECIMALS) : buybackRemaining
  const minBuyback = await ctx.client.readContract({ address: c.core, abi: coreAbi, functionName: "MIN_BUYBACK_USDC" })
  // Core reverts BelowMinBuyback for payments under the minimum unless the payment clears the loan.
  if (payment === 0n || payment > buybackRemaining || (payment < minBuyback && payment !== buybackRemaining)) {
    throw new BasedLoansError(
      `Payment must be between ${fromRaw(minBuyback, USDC_DECIMALS)} USDC and the ${fromRaw(buybackRemaining, USDC_DECIMALS)} USDC still owed (or exactly the full amount).`,
      "INVALID_PAYMENT",
    )
  }
  const meta = await readTokenMeta(ctx, asset)
  const isFinal = payment === buybackRemaining
  const collateralOut = isFinal ? collateralRemaining : (loan[2] * payment) / buybackPrice

  const warnings: string[] = []
  await balanceCheck(ctx, c.usdc, input.borrower ?? borrower, payment, `${fromRaw(payment, USDC_DECIMALS)} USDC`, warnings)
  const steps: UnsignedTransaction[] = []
  // Buyback payments are pulled by the ledger the loan was opened on, not Core.
  const approve = await approvalStep(ctx, c.usdc, input.borrower ?? borrower, ledger, payment, `${fromRaw(payment, USDC_DECIMALS)} USDC`)
  if (approve) steps.push(approve)
  steps.push(
    tx(
      ctx,
      c.core,
      encodeFunctionData({ abi: coreAbi, functionName: "buyback", args: [id, payment] }),
      `Pay ${fromRaw(payment, USDC_DECIMALS)} USDC on loan ${id} and get back ${fromRaw(collateralOut, meta.decimals)} ${meta.symbol}.`,
    ),
  )
  return {
    steps,
    summary: isFinal
      ? `Buy back all remaining collateral on loan ${id}.`
      : `Partly buy back loan ${id}; ${fromRaw(buybackRemaining - payment, USDC_DECIMALS)} USDC would remain.`,
    warnings,
  }
}

// ─── Lending ──────────────────────────────────────────────────────────────────

export interface TokenLimit {
  asset: Address
  /** Max USDC you will lend against this token. 0 removes it (only when nothing is in active loans). */
  limitUsdc: AmountInput
}

export interface BuildDepositInput {
  amountUsdc: AmountInput
  lender?: Address
  /** Set per-token limits in the same transaction. Required for a first deposit to start lending. */
  limits?: TokenLimit[]
}

export async function buildDeposit(ctx: Context, input: BuildDepositInput): Promise<TransactionPlan> {
  const [c, params] = await Promise.all([ctx.contracts(), getProtocolParams(ctx)])
  const amount = toRaw(input.amountUsdc, USDC_DECIMALS)
  const min = toRaw(params.minDepositUsdc, USDC_DECIMALS)
  if (amount < min) throw new BasedLoansError(`Minimum deposit is ${params.minDepositUsdc} USDC.`, "BELOW_MIN_DEPOSIT")
  const warnings: string[] = []
  await balanceCheck(ctx, c.usdc, input.lender, amount, `${fromRaw(amount, USDC_DECIMALS)} USDC`, warnings)
  const limits = input.limits ? await validateLimits(ctx, input.limits, input.lender) : null

  const steps: UnsignedTransaction[] = []
  const approve = await approvalStep(ctx, c.usdc, input.lender, c.ledger, amount, `${fromRaw(amount, USDC_DECIMALS)} USDC`)
  if (approve) steps.push(approve)
  if (limits && limits.assets.length > 0) {
    steps.push(
      tx(
        ctx,
        c.ledger,
        encodeFunctionData({ abi: ledgerAbi, functionName: "depositAndSetCaps", args: [amount, limits.assets, limits.caps] }),
        `Deposit ${fromRaw(amount, USDC_DECIMALS)} USDC and set lending limits for ${limits.labels.join(", ")}.`,
      ),
    )
  } else {
    steps.push(tx(ctx, c.ledger, encodeFunctionData({ abi: ledgerAbi, functionName: "deposit", args: [amount] }), `Deposit ${fromRaw(amount, USDC_DECIMALS)} USDC.`))
    if (input.lender) {
      const assets = await ctx.client.readContract({ address: c.ledger, abi: ledgerAbi, functionName: "getLenderAssets", args: [input.lender] })
      if (assets.length === 0) warnings.push("No tokens selected yet, so this USDC will not be lent until you set at least one per-token limit.")
    }
  }
  warnings.push(
    "Deposits are held as mUSDC: a 0.05% fee applies on deposit and 0.25% when withdrawing as USDC (withdrawing as mUSDC skips the second fee).",
    "Lenders are paid back when borrowers buy back their collateral. If a borrower does not, lenders receive their share of the collateral instead of USDC.",
  )
  if (limits) warnings.push(...limits.warnings)
  return { steps, summary: `Deposit ${fromRaw(amount, USDC_DECIMALS)} USDC to lend on Based Loans.`, warnings }
}

export async function buildSetLimits(ctx: Context, input: { limits: TokenLimit[]; lender?: Address }): Promise<TransactionPlan> {
  const c = await ctx.contracts()
  const v = await validateLimits(ctx, input.limits, input.lender)
  return {
    steps: [
      tx(ctx, c.ledger, encodeFunctionData({ abi: ledgerAbi, functionName: "updateCap", args: [v.assets, v.caps] }), `Set lending limits: ${v.labels.join(", ")}.`),
    ],
    summary: `Update per-token lending limits for ${v.assets.length} token${v.assets.length === 1 ? "" : "s"}.`,
    warnings: v.warnings,
  }
}

async function validateLimits(ctx: Context, limits: TokenLimit[], lender?: Address) {
  if (limits.length === 0) throw new BasedLoansError("Provide at least one token limit.", "INVALID_INPUT")
  const [c, params] = await Promise.all([ctx.contracts(), getProtocolParams(ctx)])
  const min = toRaw(params.minAssetCapUsdc, USDC_DECIMALS)
  const max = toRaw(params.maxAssetCapUsdc, USDC_DECIMALS)
  const assets: Address[] = []
  const caps: bigint[] = []
  const labels: string[] = []
  const warnings: string[] = []
  for (const l of limits) {
    const asset = getAddress(l.asset)
    const cap = toRaw(l.limitUsdc, USDC_DECIMALS)
    const meta = await readTokenMeta(ctx, asset)
    if (cap !== 0n && (cap < min || cap > max)) {
      throw new BasedLoansError(`${meta.symbol} limit must be between ${params.minAssetCapUsdc} and ${params.maxAssetCapUsdc} USDC (or 0 to remove).`, "INVALID_CAP")
    }
    if (lender) {
      const [, utilized] = await ctx.client.readContract({ address: c.ledger, abi: ledgerAbi, functionName: "getAssetCap", args: [lender, asset] })
      if (cap !== 0n && cap < utilized) {
        throw new BasedLoansError(`${meta.symbol} limit cannot be below the ${fromRaw(utilized, USDC_DECIMALS)} USDC already in active loans.`, "CAP_BELOW_ACTIVE")
      }
    }
    assets.push(asset)
    caps.push(cap)
    labels.push(cap === 0n ? `${meta.symbol} removed` : `${meta.symbol} up to ${fromRaw(cap, USDC_DECIMALS)} USDC`)
  }
  warnings.push("Check each token with getRiskReport before lending against it. Thin or single-source tokens carry more risk.")
  return { assets, caps, labels, warnings }
}

export interface BuildWithdrawInput {
  /** USDC to withdraw, or "max" for everything not in active loans. */
  amountUsdc: AmountInput | "max"
  lender: Address
  /** Receive mUSDC shares instead of USDC (no 0.25% withdrawal fee). */
  asMusdc?: boolean
}

export async function buildWithdraw(ctx: Context, input: BuildWithdrawInput): Promise<TransactionPlan> {
  const c = await ctx.contracts()
  // getAccount().idle is net of the 0.25% redeem fee. That is exact for withdraw(), but
  // withdrawAsMusdc() pays no redeem fee and checks the gross share value, so it allows more.
  const [, , idle] = await ctx.client.readContract({ address: c.ledger, abi: ledgerAbi, functionName: "getAccount", args: [input.lender] })
  if (idle === 0n) throw new BasedLoansError("Nothing available to withdraw right now. Funds in active loans unlock as borrowers buy back.", "NOTHING_TO_WITHDRAW")
  const fn = input.asMusdc ? "withdrawAsMusdc" : "withdraw"
  const fits = async (amt: bigint) =>
    ctx.client
      .call({ account: input.lender, to: c.ledger, data: encodeFunctionData({ abi: ledgerAbi, functionName: fn, args: [amt] }) })
      .then(() => true)
      .catch(() => false)

  let amount: bigint
  if (input.amountUsdc === "max") {
    amount = idle
    if (input.asMusdc) {
      // Try the gross value first (net / 0.9975, rounded down); fall back to net if the contract disagrees.
      const gross = (idle * 10_000n) / 9_975n
      if (gross > idle && (await fits(gross))) amount = gross
    }
  } else {
    amount = toRaw(input.amountUsdc, USDC_DECIMALS)
    if (amount === 0n) throw new BasedLoansError("Amount cannot be zero.", "ZERO_AMOUNT")
    const ok = amount <= idle || (input.asMusdc ? await fits(amount) : false)
    if (!ok) {
      throw new BasedLoansError(`Only ${fromRaw(idle, USDC_DECIMALS)} USDC is available to withdraw${input.asMusdc ? " (slightly more as mUSDC)" : ""}. The rest is in active loans.`, "INSUFFICIENT_AVAILABLE")
    }
  }
  return {
    steps: [tx(ctx, c.ledger, encodeFunctionData({ abi: ledgerAbi, functionName: fn, args: [amount] }), `Withdraw ${fromRaw(amount, USDC_DECIMALS)} USDC${input.asMusdc ? " as mUSDC" : ""}.`)],
    summary: `Withdraw ${fromRaw(amount, USDC_DECIMALS)} USDC from Based Loans.`,
    warnings: input.asMusdc ? [] : ["A 0.25% vault fee applies when withdrawing as USDC."],
  }
}

export async function buildClaimProceeds(
  ctx: Context,
  input: { loanIds: (bigint | number | string)[]; mode?: "withdraw" | "redeploy" },
): Promise<TransactionPlan> {
  const c = await ctx.contracts()
  const ids = input.loanIds.map((x) => BigInt(x))
  if (ids.length === 0 || ids.length > 50) throw new BasedLoansError("Claim between 1 and 50 loans at a time.", "INVALID_BATCH")
  const redeploy = input.mode === "redeploy"
  const data = redeploy
    ? encodeFunctionData({ abi: ledgerAbi, functionName: "redeployLoanProceeds", args: [c.core, ids] })
    : encodeFunctionData({ abi: ledgerAbi, functionName: "claimLoanProceeds", args: [c.core, ids] })
  return {
    steps: [tx(ctx, c.ledger, data, redeploy ? `Put repaid USDC from ${ids.length} loan(s) back into lending.` : `Withdraw repaid USDC from ${ids.length} loan(s).`)],
    summary: redeploy ? "Re-lend repaid proceeds." : "Claim repaid proceeds to your wallet.",
    warnings: [],
  }
}

export async function buildClaimCollateral(ctx: Context, input: { loanIds: (bigint | number | string)[] }): Promise<TransactionPlan> {
  const c = await ctx.contracts()
  const ids = input.loanIds.map((x) => BigInt(x))
  if (ids.length === 0 || ids.length > 50) throw new BasedLoansError("Claim between 1 and 50 loans at a time.", "INVALID_BATCH")
  return {
    steps: [tx(ctx, c.core, encodeFunctionData({ abi: coreAbi, functionName: "claimCollateral", args: [ids] }), `Claim your share of collateral from ${ids.length} defaulted loan(s).`)],
    summary: "Claim collateral from loans that passed their due date without a full buyback.",
    warnings: ["Loans that are not yet past due, already claimed, or that you did not fund are skipped."],
  }
}

export async function buildSetAutoRedeploy(ctx: Context, input: { enabled: boolean }): Promise<TransactionPlan> {
  const c = await ctx.contracts()
  return {
    steps: [tx(ctx, c.ledger, encodeFunctionData({ abi: ledgerAbi, functionName: "setAutoRedeploy", args: [input.enabled] }), `${input.enabled ? "Turn on" : "Turn off"} automatic re-lending of repaid principal.`)],
    summary: input.enabled ? "Repaid principal goes back into lending automatically." : "Repaid principal stays available to withdraw.",
    warnings: [],
  }
}
