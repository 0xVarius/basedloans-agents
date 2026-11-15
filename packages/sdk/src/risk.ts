import { getAddress, parseAbi, type Address } from "viem"
import { BASE_USDC, BASE_WETH, THIN_COST_USD, VERY_THIN_COST_USD } from "./constants.js"
import type { Context } from "./context.js"
import { costToMovePrice, maxReadableHistory, readPoolState, tokenDecimals, tokenSymbol } from "./depth.js"
import { getMarketInternal, readPriceReport, readSourcePrices, type MarketInternal } from "./markets.js"
import type { DecodedSource } from "./sources.js"
import type { PoolDepth, PriceSourceInfo, RiskFlag, RiskReport } from "./types.js"
import { bpsToPercent } from "./units.js"

const vaultAbi = parseAbi([
  "function asset() view returns (address)",
  "function decimals() view returns (uint8)",
  "function convertToAssets(uint256) view returns (uint256)",
])

/**
 * Plain-language notes for each flag. Written for the person deciding whether to lend
 * against a token. They describe what the data means, not what to do about it.
 */
const EXPLAIN: Record<RiskFlag, string> = {
  ASSET_INACTIVE: "New loans against this token are switched off. Existing loans still work normally.",
  SINGLE_PRICE_SOURCE:
    "This token's price comes from one market only, so there is no second source to compare it against. Loans are sized from whatever that one market says.",
  PRICE_SOURCE_DOWN:
    "At least one configured price source is not returning a price right now. The protocol skips it and uses the ones that work.",
  PRICE_UNAVAILABLE:
    "Fewer price sources are working than this token requires, so new loans against it will fail until they recover.",
  VERY_THIN_MARKET:
    "The market this token is priced from holds very little money near the current price. Small trades move the price a lot, and the time-weighted average follows within the pricing window.",
  THIN_MARKET:
    "The market this token is priced from is small. Moderate trades can move the price, and the time-weighted average follows within the pricing window.",
  CHEAP_TO_MOVE_PRICE:
    "The amount of money needed to double this token's reference price is less than the money currently available to borrow against it. Lenders backing this token are exposed to that gap.",
  NO_ACTIVE_LOAN_CAP:
    "There is no protocol-wide limit on total active loans against this token. The only limits are the per-lender caps set by each lender.",
  DERIVED_PRICE:
    "This token is priced from another token's price multiplied by an exchange rate read from its contract. Its risk is mostly the base token's risk, plus trust in that rate.",
  FIXED_RATIO_PRICE:
    "This token is priced from another token's price multiplied by a fixed ratio set by governance. If the real market discount changes, the protocol's price will not follow until governance updates it.",
  COLLATERAL_MAY_NOT_BE_LIQUID:
    "If the borrower does not buy this collateral back, lenders receive the token itself. Escrowed, locked or staked tokens may need to vest or be redeemed before they can be sold.",
}

export interface RiskOptions {
  /** Skip the pool depth walk (faster, fewer RPC calls). History and sources are still read. */
  skipDepth?: boolean
}

/**
 * Builds a risk report for a collateral token from live chain data. Every number comes from
 * the pools and contracts as they are right now; nothing is cached or hardcoded.
 */
export async function getRiskReport(ctx: Context, assetIn: Address, opts: RiskOptions = {}): Promise<RiskReport | null> {
  const mi = await getMarketInternal(ctx, assetIn)
  if (!mi) return null
  return buildReport(ctx, mi, opts, 0)
}

async function buildReport(ctx: Context, mi: MarketInternal, opts: RiskOptions, depth: number): Promise<RiskReport> {
  const { market, cfg, report, decoded, meta } = mi
  const perSource = await readSourcePrices(ctx, cfg)

  const sources: PriceSourceInfo[] = decoded.map((d, i) => ({
    kind: d.kind,
    adapter: d.adapter,
    live: perSource[i] != null,
    priceUsd: perSource[i] ?? null,
    pool: d.pool,
    twapWindowSeconds: d.twapWindowSeconds,
    twoHop: d.hopPool != null || undefined,
    quoteToken: d.quoteToken,
    baseToken: d.baseToken,
    ratioContract: d.ratioContract,
    fixedRatio: d.fixedRatio,
  }))

  const liveSources = sources.filter((s) => s.live).length
  const configuredLive = decoded.filter((d) => d.kind !== "pyth_retired").length
  const flags = new Set<RiskFlag>()

  if (!cfg.isActive) flags.add("ASSET_INACTIVE")
  if (configuredLive <= 1 || cfg.minSources <= 1) flags.add("SINGLE_PRICE_SOURCE")
  if (liveSources < configuredLive) flags.add("PRICE_SOURCE_DOWN")
  if (!report || report.validCount < cfg.minSources || report.minPriceUsdc18 === 0n) flags.add("PRICE_UNAVAILABLE")
  if (cfg.maxExposureUsdc === 0n) flags.add("NO_ACTIVE_LOAN_CAP")

  const pricingType = market.pricingType
  if (pricingType === "derived_live_ratio") flags.add("DERIVED_PRICE")
  if (pricingType === "derived_fixed_ratio") {
    flags.add("FIXED_RATIO_PRICE")
    flags.add("COLLATERAL_MAY_NOT_BE_LIQUID")
  }
  if (looksEscrowed(meta.symbol)) flags.add("COLLATERAL_MAY_NOT_BE_LIQUID")

  // Pool depth: for derived tokens, the pools that matter belong to the base token.
  let pools: PoolDepth[] = []
  const poolSources = decoded.filter((d) => d.pool && (d.kind === "dex_twap_uniswap_v3" || d.kind === "dex_twap_algebra"))
  if (poolSources.length > 0) {
    pools = await Promise.all(poolSources.map((d) => describePool(ctx, d, meta.address, cfg, opts)))
    // Two-hop prices depend on the second pool too (intermediate token against the final quote).
    const hops = poolSources.filter((d) => d.hopPool && d.quoteToken && d.hopQuote)
    const hopPools = await Promise.all(
      hops.map((d) =>
        describePool(
          ctx,
          { ...d, pool: d.hopPool, quoteToken: d.hopQuote, hopPool: undefined, quoteVault: undefined },
          d.quoteToken!,
          cfg,
          opts,
        ).then((p) => ({ ...p, note: [p.note, "Second hop of a two-hop price: moving this pool moves the token's price too."].filter(Boolean).join(" ") })),
      ),
    )
    pools.push(...hopPools)
  } else if (depth === 0) {
    const base = decoded.find((d) => d.kind === "derived_ratio")?.baseToken
    if (base) {
      const baseMi = await getMarketInternal(ctx, base)
      if (baseMi) {
        const baseReport = await buildReport(ctx, baseMi, opts, 1)
        pools = baseReport.pools.map((p) => ({ ...p, note: [p.note, `Pool belongs to the base token ${baseMi.meta.symbol}.`].filter(Boolean).join(" ") }))
        for (const f of baseReport.flags) if (f === "VERY_THIN_MARKET" || f === "THIN_MARKET" || f === "CHEAP_TO_MOVE_PRICE") flags.add(f)
      }
    }
  }

  const available = Number(market.availableToBorrowUsdc)
  const cheapest = pools.map((p) => p.costToDoublePriceUsd).filter((x): x is number => x != null)
  if (cheapest.length > 0) {
    const minCost = Math.min(...cheapest)
    if (minCost < VERY_THIN_COST_USD) flags.add("VERY_THIN_MARKET")
    else if (minCost < THIN_COST_USD) flags.add("THIN_MARKET")
    if (available > 0 && minCost < available) flags.add("CHEAP_TO_MOVE_PRICE")
  }

  const flagList = [...flags]
  const level = severity(flagList)
  const crossCheckActive = cfg.minSources >= 2 && configuredLive >= 2

  return {
    asset: market.asset,
    symbol: meta.symbol,
    pricingType,
    summary: summarize(meta.symbol, pricingType, flagList, cfg.minSources, configuredLive, pools, market.availableToBorrowUsdc, cfg.maxDeviationBps),
    flags: flagList,
    level,
    minSources: cfg.minSources,
    liveSources,
    crossCheckActive,
    maxDeviationBps: Number(cfg.maxDeviationBps),
    sources,
    pools,
    availableToBorrowUsdc: market.availableToBorrowUsdc,
    activeLoanCapUsdc: market.activeLoanCapUsdc,
    explanations: Object.fromEntries(flagList.map((f) => [f, EXPLAIN[f]])) as Partial<Record<RiskFlag, string>>,
  }
}

async function describePool(
  ctx: Context,
  d: DecodedSource,
  asset: Address,
  cfg: MarketInternal["cfg"],
  opts: RiskOptions,
): Promise<PoolDepth> {
  const pool = d.pool!
  const kind = d.kind === "dex_twap_algebra" ? "algebra" : "v3"
  const quote = d.quoteToken!
  const base: PoolDepth = {
    pool,
    kind: kind === "v3" ? "uniswap_v3_compatible" : "algebra",
    method: "approximate",
    quoteToken: quote,
    quoteSymbol: null,
    feeBps: null,
    maxReadableHistorySeconds: 0,
    costToDoublePriceUsd: null,
    costToTenXPriceUsd: null,
  }
  try {
    const [state, history, qSym, qDec] = await Promise.all([
      readPoolState(ctx, pool, kind),
      maxReadableHistory(ctx, pool, kind).catch(() => 0),
      tokenSymbol(ctx, quote),
      tokenDecimals(ctx, quote),
    ])
    base.quoteSymbol = qSym
    base.feeBps = state.feePpm != null ? state.feePpm / 100 : null
    base.maxReadableHistorySeconds = history
    if (opts.skipDepth) {
      base.note = "Depth not computed."
      return base
    }
    const quoteUsd = await quoteTokenUsd(ctx, d, cfg, qDec)
    const cost = await costToMovePrice(ctx, pool, kind, state, getAddress(asset), [2, 10])
    base.method = cost.method
    if (cost.note) base.note = cost.note
    if (quoteUsd != null) {
      const toUsd = (raw: bigint | undefined) => (raw == null ? null : (Number(raw) / 10 ** qDec) * quoteUsd)
      base.costToDoublePriceUsd = toUsd(cost.costRaw.get(2))
      base.costToTenXPriceUsd = toUsd(cost.costRaw.get(10))
    } else {
      base.note = [base.note, "Quote token has no USD price available, so costs are not shown."].filter(Boolean).join(" ")
    }
    if (d.hopPool) base.note = [base.note, "Two-hop price: this is the first hop only."].filter(Boolean).join(" ")
  } catch (e) {
    base.note = `Pool data unavailable: ${(e as Error).message?.slice(0, 80) ?? "read failed"}`
  }
  return base
}

/** USD value of one unit of the pool's quote token. */
async function quoteTokenUsd(ctx: Context, d: DecodedSource, cfg: MarketInternal["cfg"], quoteDecimals: number): Promise<number | null> {
  const q = d.quoteToken!.toLowerCase()
  if (q === BASE_USDC.toLowerCase()) return 1
  if (d.quoteVault) {
    // Quote is a vault share (e.g. mUSDC). Convert one share to underlying and price that.
    try {
      const c = { address: d.quoteVault, abi: vaultAbi } as const
      const [underlying, vDec] = await Promise.all([
        ctx.client.readContract({ ...c, functionName: "asset" }),
        ctx.client.readContract({ ...c, functionName: "decimals" }),
      ])
      const perShare = await ctx.client.readContract({ ...c, functionName: "convertToAssets", args: [10n ** BigInt(vDec)] })
      const uDec = await tokenDecimals(ctx, underlying)
      const rate = Number(perShare) / 10 ** uDec
      if (underlying.toLowerCase() === BASE_USDC.toLowerCase()) return rate
      const uMi = await getMarketInternal(ctx, underlying)
      return uMi?.market.priceUsd != null ? uMi.market.priceUsd * rate : null
    } catch {
      return null
    }
  }
  if (q === BASE_WETH.toLowerCase()) {
    // The protocol's own ETH/USD read: WETH sources are direct-USD sources.
    if (cfg.wethSources.length > 0) {
      try {
        const r = await readPriceReport(ctx, { ...cfg, sources: cfg.wethSources, wethSources: [] }, cfg.wethSources)
        if (r.validCount > 0) return Number(r.minPriceUsdc18) / 1e18
      } catch {
        /* fall through */
      }
    }
    const wethMi = await getMarketInternal(ctx, BASE_WETH)
    return wethMi?.market.priceUsd ?? null
  }
  // Some other token (two-hop intermediate). Use its own Based Loans price if it is listed.
  const qMi = await getMarketInternal(ctx, d.quoteToken!)
  void quoteDecimals
  return qMi?.market.priceUsd ?? null
}

function severity(flags: RiskFlag[]): RiskReport["level"] {
  const high: RiskFlag[] = ["VERY_THIN_MARKET", "CHEAP_TO_MOVE_PRICE", "PRICE_UNAVAILABLE"]
  const medium: RiskFlag[] = ["THIN_MARKET", "SINGLE_PRICE_SOURCE", "FIXED_RATIO_PRICE", "PRICE_SOURCE_DOWN"]
  if (flags.some((f) => high.includes(f))) return "high"
  if (flags.some((f) => medium.includes(f))) return "medium"
  return "low"
}

function looksEscrowed(symbol: string): boolean {
  return /^(es|x|xl-|ve|gov|st|s)[A-Z]/.test(symbol) || /^(es|x|ve)[A-Z0-9]/.test(symbol)
}

function summarize(
  symbol: string,
  pricingType: RiskReport["pricingType"],
  flags: RiskFlag[],
  minSources: number,
  configured: number,
  pools: PoolDepth[],
  available: string,
  maxDeviationBps: bigint,
): string {
  const parts: string[] = []
  const how =
    pricingType === "market"
      ? `${symbol} is priced from ${configured === 1 ? "one market" : `${configured} sources`}`
      : pricingType === "market_two_hop"
        ? `${symbol} is priced through an intermediate token`
        : pricingType === "derived_live_ratio"
          ? `${symbol} is priced from its base token times a live exchange rate`
          : `${symbol} is priced from its base token times a fixed ratio`
  parts.push(
    minSources >= 2 && configured >= 2
      ? `${how}, and at least ${minSources} must agree within ${bpsToPercent(Number(maxDeviationBps))}.`
      : `${how}, with no second source to cross-check it.`,
  )
  const p = pools[0]
  if (p) {
    const hrs = Math.round(p.maxReadableHistorySeconds / 3600)
    parts.push(`Its reference pool can serve a time-weighted average up to about ${hrs} hour${hrs === 1 ? "" : "s"} long.`)
    if (p.costToDoublePriceUsd != null) {
      parts.push(`Doubling its pool price would take roughly $${fmtUsd(p.costToDoublePriceUsd)} of trading.`)
    }
  }
  parts.push(`$${fmtUsd(Number(available))} USDC is currently available to borrow against it.`)
  if (flags.includes("COLLATERAL_MAY_NOT_BE_LIQUID")) parts.push("Lenders who end up holding it may need to redeem or wait for vesting before selling.")
  return parts.join(" ")
}

function fmtUsd(n: number): string {
  if (n >= 1000) return Math.round(n).toLocaleString("en-US")
  return n.toFixed(2).replace(/\.?0+$/, "")
}
