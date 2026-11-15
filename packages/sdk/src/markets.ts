import { erc20Abi, getAddress, type Address } from "viem"
import { assetManagerAbi } from "./abis/assetManager.js"
import { coreAbi } from "./abis/core.js"
import { ledgerAbi } from "./abis/ledger.js"
import { oracleManagerAbi } from "./abis/oracleManager.js"
import { USDC_DECIMALS } from "./constants.js"
import type { Context } from "./context.js"
import { BasedLoansError } from "./errors.js"
import { assertNoTransportFailures, isRevert } from "./rpc.js"
import { classifyPricing, decodeSource, type DecodedSource, type RawSource } from "./sources.js"
import type { KnownAsset, Market } from "./types.js"
import { fromRaw } from "./units.js"

export interface AssetConfig {
  sources: RawSource[]
  wethSources: RawSource[]
  maxDeviationBps: bigint
  maxLtvBps: number
  minSources: number
  isActive: boolean
  maxExposureUsdc: bigint
}

export interface PriceReport {
  minPriceUsdc18: bigint
  maxPriceUsdc18: bigint
  deviationBps: bigint
  validCount: number
}

/** Reads an asset's config. Returns null if the token is not set up on Based Loans. */
export async function readAssetConfig(ctx: Context, asset: Address): Promise<AssetConfig | null> {
  const c = await ctx.contracts()
  const configured = await ctx.client.readContract({
    address: c.assetManager,
    abi: assetManagerAbi,
    functionName: "isConfigured",
    args: [asset],
  })
  if (!configured) return null
  const cfg = await ctx.client.readContract({
    address: c.assetManager,
    abi: assetManagerAbi,
    functionName: "getAssetConfig",
    args: [asset],
  })
  return normalizeConfig(cfg)
}

function normalizeConfig(cfg: {
  sources: readonly { adapter: Address; data: `0x${string}`; sourceType: number }[]
  wethSources: readonly { adapter: Address; data: `0x${string}`; sourceType: number }[]
  maxDeviationBps: bigint
  maxLtvBps: number
  minSources: number
  isActive: boolean
  maxExposureUsdc: bigint
}): AssetConfig {
  return {
    sources: cfg.sources.map((s) => ({ adapter: s.adapter, data: s.data, sourceType: Number(s.sourceType) })),
    wethSources: cfg.wethSources.map((s) => ({ adapter: s.adapter, data: s.data, sourceType: Number(s.sourceType) })),
    maxDeviationBps: cfg.maxDeviationBps,
    maxLtvBps: Number(cfg.maxLtvBps),
    minSources: Number(cfg.minSources),
    isActive: cfg.isActive,
    maxExposureUsdc: cfg.maxExposureUsdc,
  }
}

/** The protocol's aggregated price, exactly as Core reads it at loan open. */
export async function readPriceReport(ctx: Context, cfg: AssetConfig, sources = cfg.sources): Promise<PriceReport> {
  const c = await ctx.contracts()
  const [minPriceUsdc18, maxPriceUsdc18, deviationBps, validCount] = await ctx.client.readContract({
    address: c.oracleManager,
    abi: oracleManagerAbi,
    functionName: "getPriceReport",
    args: [toTuple(sources), toTuple(cfg.wethSources)],
  })
  return { minPriceUsdc18, maxPriceUsdc18, deviationBps, validCount: Number(validCount) }
}

/** Prices each source on its own so callers can see which ones work right now. */
export async function readSourcePrices(ctx: Context, cfg: AssetConfig): Promise<(number | null)[]> {
  return Promise.all(
    cfg.sources.map(async (s) => {
      try {
        const r = await readPriceReport(ctx, cfg, [s])
        return r.validCount > 0 ? Number(r.minPriceUsdc18) / 1e18 : null
      } catch {
        return null
      }
    }),
  )
}

const toTuple = (s: RawSource[]) =>
  s.map((x) => ({ adapter: x.adapter, data: x.data, sourceType: x.sourceType })) as readonly {
    adapter: Address
    data: `0x${string}`
    sourceType: number
  }[]

export async function readTokenMeta(ctx: Context, asset: Address): Promise<KnownAsset> {
  const known = ctx.assets.get(asset.toLowerCase())
  if (known) return known
  const [symbol, name, decimals] = await Promise.all([
    ctx.client.readContract({ address: asset, abi: erc20Abi, functionName: "symbol" }).catch(() => "UNKNOWN"),
    ctx.client.readContract({ address: asset, abi: erc20Abi, functionName: "name" }).catch(() => "Unknown token"),
    ctx.client.readContract({ address: asset, abi: erc20Abi, functionName: "decimals" }),
  ])
  return { address: getAddress(asset), symbol, name, decimals }
}

export interface MarketInternal {
  market: Market
  cfg: AssetConfig
  report: PriceReport | null
  decoded: DecodedSource[]
  meta: KnownAsset
}

export async function getMarketInternal(ctx: Context, assetIn: Address): Promise<MarketInternal | null> {
  const asset = getAddress(assetIn)
  const cfg = await readAssetConfig(ctx, asset)
  if (!cfg) return null
  const c = await ctx.contracts()
  const [meta, report, matchable, exposure] = await Promise.all([
    readTokenMeta(ctx, asset),
    // A revert (e.g. WethPriceUnavailable) means no usable price; an RPC failure must surface.
    readPriceReport(ctx, cfg).catch((e) => {
      if (isRevert(e)) return null
      throw e
    }),
    ctx.client.readContract({ address: c.ledger, abi: ledgerAbi, functionName: "getMatchableLiquidity", args: [asset, 0n] }),
    ctx.client.readContract({ address: c.core, abi: coreAbi, functionName: "assetExposure", args: [asset] }),
  ])
  const decoded = cfg.sources.map(decodeSource)
  const priceOk = report && report.validCount >= cfg.minSources && report.minPriceUsdc18 > 0n
  const market: Market = {
    asset,
    symbol: meta.symbol,
    name: meta.name,
    decimals: meta.decimals,
    active: cfg.isActive,
    priceUsd: priceOk ? Number(report.minPriceUsdc18) / 1e18 : null,
    maxLtvBps: cfg.maxLtvBps,
    availableToBorrowUsdc: fromRaw(matchable[0], USDC_DECIMALS),
    lendersAvailable: Number(matchable[1]),
    activeLoansUsdc: fromRaw(exposure, USDC_DECIMALS),
    activeLoanCapUsdc: fromRaw(cfg.maxExposureUsdc, USDC_DECIMALS),
    pricingType: classifyPricing(decoded),
    minSources: cfg.minSources,
    maxDeviationBps: Number(cfg.maxDeviationBps),
  }
  return { market, cfg, report, decoded, meta }
}

export async function getMarket(ctx: Context, asset: Address): Promise<Market | null> {
  return (await getMarketInternal(ctx, asset))?.market ?? null
}

/**
 * Lists markets for every known token. Inactive tokens are skipped unless includeInactive is set.
 * Uses batched reads; on a rate-limited public RPC this can take several seconds.
 */
export async function listMarkets(
  ctx: Context,
  opts: { includeInactive?: boolean; onlyWithFunds?: boolean } = {},
): Promise<Market[]> {
  const c = await ctx.contracts()
  const assets = [...ctx.assets.values()]
  const cfgs = await ctx.client.multicall({
    allowFailure: true,
    contracts: assets.map((a) => ({
      address: c.assetManager,
      abi: assetManagerAbi,
      functionName: "getAssetConfig",
      args: [a.address],
    })),
  })
  // A token that is not set up reverts with AssetNotConfigured; anything else is a transport problem
  // and must not be reported as "no markets".
  const transport = cfgs.filter(
    (r) => r.status === "failure" && !/AssetNotConfigured|reverted/i.test(String((r.error as Error)?.message ?? "")),
  )
  if (transport.length > 0) {
    throw new BasedLoansError(
      `Could not read ${transport.length} of ${assets.length} token configs (RPC error: ${String((transport[0]!.error as Error)?.message ?? "").slice(0, 80)}). Use a faster RPC or retry.`,
      "RPC_ERROR",
    )
  }
  const rows = assets
    .map((meta, i) => ({ meta, r: cfgs[i]! }))
    .filter((x) => x.r.status === "success")
    .map((x) => ({ meta: x.meta, cfg: normalizeConfig(x.r.result as never) }))
    .filter((x) => opts.includeInactive || x.cfg.isActive)

  const addrs = rows.map((r) => r.meta.address)
  const [[matchable, lenders], exposures, reports] = await Promise.all([
    ctx.client.readContract({ address: c.ledger, abi: ledgerAbi, functionName: "getMatchableLiquidityBatch", args: [addrs, 0n] }),
    ctx.client.multicall({
      allowFailure: true,
      contracts: addrs.map((a) => ({ address: c.core, abi: coreAbi, functionName: "assetExposure", args: [a] })),
    }),
    ctx.client.multicall({
      allowFailure: true,
      contracts: rows.map((r) => ({
        address: c.oracleManager,
        abi: oracleManagerAbi,
        functionName: "getPriceReport",
        args: [toTuple(r.cfg.sources), toTuple(r.cfg.wethSources)],
      })),
    }),
  ])

  assertNoTransportFailures(exposures as never, "active loan totals")
  assertNoTransportFailures(reports as never, "prices")
  const markets = rows.map(({ meta, cfg }, i): Market => {
    const rep = reports[i]!
    let priceUsd: number | null = null
    if (rep.status === "success") {
      const [minP, , , valid] = rep.result as unknown as readonly [bigint, bigint, bigint, number]
      if (Number(valid) >= cfg.minSources && minP > 0n) priceUsd = Number(minP) / 1e18
    }
    const exp = exposures[i]!
    return {
      asset: getAddress(meta.address),
      symbol: meta.symbol,
      name: meta.name,
      decimals: meta.decimals,
      active: cfg.isActive,
      priceUsd,
      maxLtvBps: cfg.maxLtvBps,
      availableToBorrowUsdc: fromRaw(matchable[i] ?? 0n, USDC_DECIMALS),
      lendersAvailable: Number(lenders[i] ?? 0n),
      activeLoansUsdc: fromRaw(exp.status === "success" ? (exp.result as bigint) : 0n, USDC_DECIMALS),
      activeLoanCapUsdc: fromRaw(cfg.maxExposureUsdc, USDC_DECIMALS),
      pricingType: classifyPricing(cfg.sources.map(decodeSource)),
      minSources: cfg.minSources,
      maxDeviationBps: Number(cfg.maxDeviationBps),
    }
  })
  return opts.onlyWithFunds ? markets.filter((m) => Number(m.availableToBorrowUsdc) > 0) : markets
}
