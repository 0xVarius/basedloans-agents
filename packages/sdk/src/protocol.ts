import { coreAbi } from "./abis/core.js"
import { feeDistributorAbi } from "./abis/feeDistributor.js"
import { ledgerAbi } from "./abis/ledger.js"
import { TERM_NAMES, USDC_DECIMALS } from "./constants.js"
import type { Context } from "./context.js"
import type { ProtocolParams, Term } from "./types.js"
import { fromRaw } from "./units.js"

/** Reads every protocol parameter live. Nothing here is hardcoded. */
export async function getProtocolParams(ctx: Context): Promise<ProtocolParams> {
  const c = await ctx.contracts()
  const core = { address: c.core, abi: coreAbi } as const
  const ledger = { address: c.ledger, abi: ledgerAbi } as const
  const [block, paused, ledgerPaused, feeBps, termConfig, minLoan, minBuyback, maxShortfall, minDeposit, minCap, maxCap, maxLenders, maxAssets] =
    await Promise.all([
      ctx.client.getBlock(),
      ctx.client.readContract({ ...core, functionName: "paused" }),
      ctx.client.readContract({ ...ledger, functionName: "pausedCores", args: [c.core] }),
      ctx.client.readContract({ address: c.feeDistributor, abi: feeDistributorAbi, functionName: "getGlobalFee" }),
      ctx.client.readContract({ ...core, functionName: "getTermConfig" }),
      ctx.client.readContract({ ...core, functionName: "MIN_LOAN_USDC" }),
      ctx.client.readContract({ ...core, functionName: "MIN_BUYBACK_USDC" }),
      ctx.client.readContract({ ...core, functionName: "maxShortfallBps" }),
      ctx.client.readContract({ ...ledger, functionName: "minDeposit" }),
      ctx.client.readContract({ ...ledger, functionName: "minAssetCap" }),
      ctx.client.readContract({ ...ledger, functionName: "maxAssetCap" }),
      ctx.client.readContract({ ...ledger, functionName: "maxLendersPerFill" }),
      ctx.client.readContract({ ...ledger, functionName: "MAX_CONFIGURED_ASSETS" }),
    ])
  const [durations, premiums] = termConfig
  const terms: Term[] = durations.map((d, i) => ({
    index: i as 0 | 1 | 2,
    name: TERM_NAMES[i]!,
    durationSeconds: Number(d),
    durationDays: Number(d) / 86400,
    buybackCostBps: Number(premiums[i]),
  }))
  return {
    chainId: ctx.chainId,
    blockNumber: block.number.toString(),
    blockTimestamp: Number(block.timestamp),
    paused: paused || ledgerPaused,
    contracts: c,
    loanFeeBps: Number(feeBps),
    terms,
    minLoanUsdc: fromRaw(minLoan, USDC_DECIMALS),
    minBuybackUsdc: fromRaw(minBuyback, USDC_DECIMALS),
    defaultMaxShortfallBps: Number(maxShortfall),
    minDepositUsdc: fromRaw(minDeposit, USDC_DECIMALS),
    minAssetCapUsdc: fromRaw(minCap, USDC_DECIMALS),
    maxAssetCapUsdc: fromRaw(maxCap, USDC_DECIMALS),
    maxLendersPerFill: Number(maxLenders),
    maxLenderAssets: Number(maxAssets),
  }
}

export function resolveTerm(terms: Term[], term: number | string): Term {
  const t =
    typeof term === "number"
      ? terms[term]
      : terms.find((x) => x.name === term.toLowerCase()) ?? terms[Number(term)]
  if (!t) throw new Error(`Unknown term "${term}". Use 0/1/2 or short/medium/long.`)
  return t
}
