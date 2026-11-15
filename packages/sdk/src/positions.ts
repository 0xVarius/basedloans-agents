import { getAddress, type Address } from "viem"
import { coreAbi } from "./abis/core.js"
import { ledgerAbi } from "./abis/ledger.js"
import { USDC_DECIMALS } from "./constants.js"
import type { Context } from "./context.js"
import { readTokenMeta } from "./markets.js"
import { assertNoTransportFailures } from "./rpc.js"
import type { LenderPosition, Loan, LoanStatus } from "./types.js"
import { fromRaw, isoDate } from "./units.js"

type RawLoan = readonly [Address, Address, bigint, bigint, bigint, bigint, bigint, number, number, boolean, readonly Address[], readonly bigint[]]
const ZERO = "0x0000000000000000000000000000000000000000"

function status(l: RawLoan, now: bigint): LoanStatus {
  const [, , , , , buybackPrice, buybackRemaining, , expiry, active] = l
  if (!active) return "repaid"
  if (now > BigInt(expiry)) return "defaulted"
  return buybackRemaining < buybackPrice ? "partially_repaid" : "active"
}

/** Makes sure every collateral token in `loans` has metadata (real decimals), reading unknown ones on-chain. */
async function loadMeta(ctx: Context, loans: [bigint, RawLoan][]): Promise<void> {
  const unknown = [...new Set(loans.map(([, l]) => l[1].toLowerCase()))].filter((a) => !ctx.assets.has(a))
  const metas = await Promise.all(unknown.map((a) => readTokenMeta(ctx, getAddress(a))))
  for (const m of metas) ctx.assets.set(m.address.toLowerCase(), m)
}

function toLoan(ctx: Context, id: bigint, l: RawLoan, now: bigint): Loan {
  const [borrower, asset, collateralAmount, collateralRemaining, totalFunded, buybackPrice, buybackRemaining, createdAt, expiry, , lenders, amounts] = l
  const meta = ctx.assets.get(asset.toLowerCase())
  if (!meta) throw new Error(`missing token metadata for ${asset}`)
  return {
    loanId: id.toString(),
    borrower,
    asset,
    symbol: meta.symbol,
    status: status(l, now),
    collateralAmount: fromRaw(collateralAmount, meta.decimals),
    collateralRemaining: fromRaw(collateralRemaining, meta.decimals),
    loanAmountUsdc: fromRaw(totalFunded, USDC_DECIMALS),
    buybackCostUsdc: fromRaw(buybackPrice, USDC_DECIMALS),
    buybackRemainingUsdc: fromRaw(buybackRemaining, USDC_DECIMALS),
    createdAt: isoDate(createdAt),
    dueDate: isoDate(expiry),
    secondsUntilDue: Math.max(0, Number(BigInt(expiry) - now)),
    lenders: lenders.map((x, i) => ({ lender: x, amountUsdc: fromRaw(amounts[i] ?? 0n, USDC_DECIMALS) })),
  }
}

export async function getLoan(ctx: Context, loanId: bigint | number | string): Promise<Loan | null> {
  const c = await ctx.contracts()
  const id = BigInt(loanId)
  const [l, block] = await Promise.all([
    ctx.client.readContract({ address: c.core, abi: coreAbi, functionName: "getLoan", args: [id] }) as Promise<RawLoan>,
    ctx.client.getBlock(),
  ])
  if (l[0] === ZERO) return null
  await loadMeta(ctx, [[id, l]])
  return toLoan(ctx, id, l, block.timestamp)
}

export async function getBorrowerLoans(ctx: Context, borrowerIn: Address): Promise<Loan[]> {
  const borrower = getAddress(borrowerIn)
  const c = await ctx.contracts()
  const [ids, block] = await Promise.all([
    ctx.client.readContract({ address: c.core, abi: coreAbi, functionName: "getBorrowerLoans", args: [borrower] }),
    ctx.client.getBlock(),
  ])
  const loans = await readLoans(ctx, [...ids])
  await loadMeta(ctx, loans)
  return loans.map(([id, l]) => toLoan(ctx, id, l, block.timestamp))
}

async function readLoans(ctx: Context, ids: bigint[]): Promise<[bigint, RawLoan][]> {
  const c = await ctx.contracts()
  const out: [bigint, RawLoan][] = []
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200)
    const res = await ctx.client.multicall({
      allowFailure: true,
      contracts: chunk.map((id) => ({ address: c.core, abi: coreAbi, functionName: "getLoan" as const, args: [id] as const })),
    })
    assertNoTransportFailures(res as never, "loans")
    res.forEach((r, j) => {
      if (r.status === "success" && (r.result as unknown as RawLoan)[0] !== ZERO) out.push([chunk[j]!, r.result as unknown as RawLoan])
    })
  }
  return out
}

/** Full lender view. Reads every loan once (one batched read per 200 loans). Loan IDs start at 0. */
export async function getLenderPosition(ctx: Context, lenderIn: Address): Promise<LenderPosition> {
  const lender = getAddress(lenderIn)
  const c = await ctx.contracts()
  const [summary, auto, nextId, block] = await Promise.all([
    ctx.client.readContract({ address: c.ledger, abi: ledgerAbi, functionName: "getLenderSummary", args: [lender] }),
    ctx.client.readContract({ address: c.ledger, abi: ledgerAbi, functionName: "autoRedeployEnabled", args: [lender] }),
    ctx.client.readContract({ address: c.core, abi: coreAbi, functionName: "nextLoanId" }),
    ctx.client.getBlock(),
  ])
  const [deposited, locked, idle, assets, maxCaps, utilized, queued] = summary

  const allIds = Array.from({ length: Number(nextId) }, (_, i) => BigInt(i))
  const mine = (await readLoans(ctx, allIds)).filter(([, l]) => l[10].some((x) => x.toLowerCase() === lender.toLowerCase()))
  await loadMeta(ctx, mine)
  for (const a of assets) if (!ctx.assets.has(a.toLowerCase())) ctx.assets.set(a.toLowerCase(), await readTokenMeta(ctx, a))

  const extras = await ctx.client.multicall({
    allowFailure: true,
    contracts: mine.flatMap(([id]) => [
      { address: c.ledger, abi: ledgerAbi, functionName: "getLoanProceedsUsdc" as const, args: [c.core, id, lender] as const },
      { address: c.core, abi: coreAbi, functionName: "getClaimableCollateral" as const, args: [id, lender] as const },
    ]),
  })
  assertNoTransportFailures(extras as never, "claimable amounts")

  return {
    lender,
    depositedUsdc: fromRaw(deposited, USDC_DECIMALS),
    inActiveLoansUsdc: fromRaw(locked, USDC_DECIMALS),
    availableToWithdrawUsdc: fromRaw(idle, USDC_DECIMALS),
    autoRedeploy: auto,
    assets: assets.map((a, i) => {
      const cap = maxCaps[i] ?? 0n
      const used = utilized[i] ?? 0n
      return {
        asset: a,
        symbol: ctx.assets.get(a.toLowerCase())?.symbol ?? null,
        capUsdc: fromRaw(cap, USDC_DECIMALS),
        inActiveLoansUsdc: fromRaw(used, USDC_DECIMALS),
        remainingCapUsdc: fromRaw(cap > used ? cap - used : 0n, USDC_DECIMALS),
        waitingToLend: queued[i] ?? false,
      }
    }),
    loans: mine.map(([id, l], k) => {
      const idx = l[10].findIndex((x) => x.toLowerCase() === lender.toLowerCase())
      const meta = ctx.assets.get(l[1].toLowerCase())!
      const proceeds = extras[k * 2]
      const coll = extras[k * 2 + 1]
      // A revert here means "nothing claimable" (e.g. loan not settled); transport errors already threw.
      return {
        loanId: id.toString(),
        asset: l[1],
        symbol: meta.symbol,
        status: status(l, block.timestamp),
        fundedUsdc: fromRaw(l[11][idx] ?? 0n, USDC_DECIMALS),
        claimableProceedsUsdc: fromRaw(proceeds?.status === "success" ? (proceeds.result as bigint) : 0n, USDC_DECIMALS),
        claimableCollateral: fromRaw(coll?.status === "success" ? (coll.result as bigint) : 0n, meta.decimals),
      }
    }),
  }
}
