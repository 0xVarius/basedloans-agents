// EvmWalletProvider must be a value import: AgentKit reads it from emitted decorator metadata
// (design:paramtypes) to decide which actions receive the wallet.
import { ActionProvider, CreateAction, EvmWalletProvider, type Network } from "@coinbase/agentkit"
import { BasedLoansError, createBasedLoans, explainError, type BasedLoans, type BasedLoansOptions, type TransactionPlan } from "@basedloans/sdk"
import { getAddress, isAddress, type Address } from "viem"
import type { z } from "zod"
import {
  BuybackSchema,
  EmptySchema,
  LendSchema,
  LimitsSchema,
  ListMarketsSchema,
  LoanIdsSchema,
  QuoteSchema,
  RequestTokenSchema,
  TokenSchema,
  WithdrawSchema,
} from "./schemas.js"

export const SUPPORTED_NETWORKS = ["base-mainnet"]

const json = (v: unknown) => JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? x.toString() : x), 2)

/**
 * Based Loans: borrow USDC against Base tokens with no liquidations, or lend USDC against tokens
 * you choose. Reads come from Base directly; write actions are signed by the agent's own wallet.
 */
export class BasedLoansActionProvider extends ActionProvider<EvmWalletProvider> {
  private readonly bl: BasedLoans

  constructor(opts: BasedLoansOptions = {}) {
    super("basedloans", [])
    this.bl = createBasedLoans(opts)
  }

  supportsNetwork = (network: Network) =>
    network.protocolFamily === "evm" && SUPPORTED_NETWORKS.includes(network.networkId ?? "")

  private token(ref: string): Address {
    if (isAddress(ref)) return getAddress(ref)
    const m = [...this.bl.ctx.assets.values()].filter((a) => a.symbol.toLowerCase() === ref.trim().toLowerCase())
    if (m.length === 1) return getAddress(m[0]!.address)
    throw new BasedLoansError(
      m.length > 1 ? `More than one token is called ${ref}; pass its contract address.` : `Unknown token "${ref}". Pass its contract address or use request_token_listing.`,
      "UNKNOWN_TOKEN",
    )
  }

  private async run(wallet: EvmWalletProvider, plan: TransactionPlan): Promise<string> {
    const hashes: string[] = []
    for (const step of plan.steps) {
      const hash = await wallet.sendTransaction({ to: step.to, data: step.data, value: BigInt(step.value) })
      const receipt = await wallet.waitForTransactionReceipt(hash)
      if (receipt?.status && receipt.status !== "success") {
        return `Failed at step "${step.description}" (tx ${hash}). Earlier steps: ${hashes.join(", ") || "none"}.`
      }
      hashes.push(hash)
    }
    return [plan.summary, ...plan.warnings.map((w) => `Note: ${w}`), `Transactions: ${hashes.join(", ")}`].join("\n")
  }

  private async safe(fn: () => Promise<string>): Promise<string> {
    try {
      return await fn()
    } catch (e) {
      return `Error: ${e instanceof BasedLoansError ? e.message : explainError(e).message}`
    }
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  @CreateAction({
    name: "get_protocol_info",
    description: "Based Loans live parameters: loan fee, the three loan terms with durations and buyback costs, minimum loan and deposit sizes, and per-token limit bounds.",
    schema: EmptySchema,
  })
  async getProtocolInfo(_args: z.infer<typeof EmptySchema>): Promise<string> {
    return this.safe(async () => json(await this.bl.getProtocolParams()))
  }

  @CreateAction({
    name: "list_markets",
    description: "Tokens accepted as collateral on Based Loans, with price, max loan-to-value and USDC available to borrow against each.",
    schema: ListMarketsSchema,
  })
  async listMarkets(args: z.infer<typeof ListMarketsSchema>): Promise<string> {
    return this.safe(async () => json(await this.bl.listMarkets({ onlyWithFunds: args.onlyWithFunds })))
  }

  @CreateAction({
    name: "get_risk_report",
    description:
      "Risk data for a token on Based Loans: price sources and whether they cross-check, pool history, how much trading would move its pool price 2x and 10x, USDC available against it, and plain-language explanations of each flag. Check this before lending against a token.",
    schema: TokenSchema,
  })
  async getRiskReport(args: z.infer<typeof TokenSchema>): Promise<string> {
    return this.safe(async () => json(await this.bl.getRiskReport(this.token(args.token))))
  }

  @CreateAction({
    name: "quote_borrow",
    description: "Exact Based Loans quote: USDC received after the fee, buyback cost and due date for borrowing against a token. No liquidations.",
    schema: QuoteSchema,
  })
  async quoteBorrow(args: z.infer<typeof QuoteSchema>): Promise<string> {
    return this.safe(async () =>
      json(await this.bl.quoteBorrow({ asset: this.token(args.token), collateralAmount: args.collateralAmount, loanAmountUsdc: args.loanAmountUsdc, term: args.term })),
    )
  }

  @CreateAction({ name: "get_my_loans", description: "Loans this wallet has borrowed on Based Loans, with status, buyback remaining and due date.", schema: EmptySchema })
  async getMyLoans(wallet: EvmWalletProvider, _args: z.infer<typeof EmptySchema>): Promise<string> {
    return this.safe(async () => json(await this.bl.getBorrowerLoans(getAddress(wallet.getAddress()))))
  }

  @CreateAction({
    name: "get_my_lending",
    description: "This wallet's Based Loans lending position: deposit, USDC in active loans, available to withdraw, per-token limits, and claimable proceeds or collateral.",
    schema: EmptySchema,
  })
  async getMyLending(wallet: EvmWalletProvider, _args: z.infer<typeof EmptySchema>): Promise<string> {
    return this.safe(async () => json(await this.bl.getLenderPosition(getAddress(wallet.getAddress()))))
  }

  @CreateAction({
    name: "request_token_listing",
    description: "Check whether a token is accepted as Based Loans collateral; if not, returns a link for a person to submit a listing request.",
    schema: RequestTokenSchema,
  })
  async requestTokenListing(args: z.infer<typeof RequestTokenSchema>): Promise<string> {
    return this.safe(async () => json(await this.bl.requestTokenListing(args.token)))
  }

  // ── Write (signed by the agent's wallet) ──────────────────────────────────

  @CreateAction({
    name: "borrow",
    description:
      "Open a Based Loans loan: deposit a token as collateral and receive USDC now. Buy it back for the fixed buyback cost before the due date, or keep the USDC and let lenders keep the collateral. Run quote_borrow first and confirm the amounts.",
    schema: QuoteSchema,
  })
  async borrow(wallet: EvmWalletProvider, args: z.infer<typeof QuoteSchema>): Promise<string> {
    return this.safe(async () =>
      this.run(
        wallet,
        await this.bl.buildBorrow({
          asset: this.token(args.token),
          collateralAmount: args.collateralAmount,
          loanAmountUsdc: args.loanAmountUsdc,
          term: args.term,
          borrower: getAddress(wallet.getAddress()),
        }),
      ),
    )
  }

  @CreateAction({ name: "buyback", description: "Pay USDC on a Based Loans loan to get collateral back. Omit paymentUsdc to repay in full.", schema: BuybackSchema })
  async buyback(wallet: EvmWalletProvider, args: z.infer<typeof BuybackSchema>): Promise<string> {
    return this.safe(async () =>
      this.run(wallet, await this.bl.buildBuyback({ loanId: args.loanId, paymentUsdc: args.paymentUsdc, borrower: getAddress(wallet.getAddress()) })),
    )
  }

  @CreateAction({
    name: "lend",
    description:
      "Deposit USDC to lend on Based Loans, optionally setting per-token lending limits (needed before a first deposit is lent). Run get_risk_report on each token first.",
    schema: LendSchema,
  })
  async lend(wallet: EvmWalletProvider, args: z.infer<typeof LendSchema>): Promise<string> {
    return this.safe(async () =>
      this.run(
        wallet,
        await this.bl.buildDeposit({
          amountUsdc: args.amountUsdc,
          lender: getAddress(wallet.getAddress()),
          limits: args.limits?.map((l) => ({ asset: this.token(l.token), limitUsdc: l.limitUsdc })),
        }),
      ),
    )
  }

  @CreateAction({ name: "set_lending_limits", description: "Add, change or remove per-token lending limits on Based Loans.", schema: LimitsSchema })
  async setLendingLimits(wallet: EvmWalletProvider, args: z.infer<typeof LimitsSchema>): Promise<string> {
    return this.safe(async () =>
      this.run(
        wallet,
        await this.bl.buildSetLimits({ limits: args.limits.map((l) => ({ asset: this.token(l.token), limitUsdc: l.limitUsdc })), lender: getAddress(wallet.getAddress()) }),
      ),
    )
  }

  @CreateAction({ name: "withdraw", description: "Withdraw USDC from Based Loans that is not in active loans.", schema: WithdrawSchema })
  async withdraw(wallet: EvmWalletProvider, args: z.infer<typeof WithdrawSchema>): Promise<string> {
    return this.safe(async () =>
      this.run(wallet, await this.bl.buildWithdraw({ amountUsdc: args.amountUsdc, lender: getAddress(wallet.getAddress()), asMusdc: args.asMusdc })),
    )
  }

  @CreateAction({ name: "claim_proceeds", description: "Claim repaid USDC from Based Loans loans this wallet funded (or re-lend it with mode redeploy).", schema: LoanIdsSchema })
  async claimProceeds(wallet: EvmWalletProvider, args: z.infer<typeof LoanIdsSchema>): Promise<string> {
    return this.safe(async () => this.run(wallet, await this.bl.buildClaimProceeds({ loanIds: args.loanIds, mode: args.mode })))
  }

  @CreateAction({ name: "claim_collateral", description: "Claim this wallet's share of collateral from Based Loans loans that passed their due date without a buyback.", schema: LoanIdsSchema })
  async claimCollateral(wallet: EvmWalletProvider, args: z.infer<typeof LoanIdsSchema>): Promise<string> {
    return this.safe(async () => this.run(wallet, await this.bl.buildClaimCollateral({ loanIds: args.loanIds })))
  }
}

export const basedLoansActionProvider = (opts: BasedLoansOptions = {}) => new BasedLoansActionProvider(opts)
