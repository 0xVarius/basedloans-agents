import { decodeAbiParameters, erc20Abi, parseAbi, type Address, type Hex } from "viem"
import type { Context } from "./context.js"
import { getSqrtRatioAtTick, MAX_TICK, MIN_TICK, Q96 } from "./tickMath.js"

const poolAbi = parseAbi([
  "function liquidity() view returns (uint128)",
  "function tickSpacing() view returns (int24)",
  "function fee() view returns (uint24)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function tickBitmap(int16) view returns (uint256)",
  "function plugin() view returns (address)",
  "function observe(uint32[] secondsAgos) view returns (int56[] tickCumulatives, uint160[] secondsPerLiquidityCumulativeX128s)",
])
const pluginAbi = parseAbi([
  "function getTimepoints(uint32[] secondsAgos) view returns (int56[] tickCumulatives, uint88[] volatilityCumulatives)",
])

const HISTORY_PROBES = [1800, 3600, 7200, 14400, 21600, 43200, 86400] as const
const MAX_BITMAP_WORDS = 48

export interface PoolState {
  sqrtPriceX96: bigint
  tick: number
  liquidity: bigint
  token0: Address
  token1: Address
  /** Swap fee in millionths (3000 = 0.3%), or null if unknown. */
  feePpm: number | null
  tickSpacing: number | null
}

async function rawWords(ctx: Context, to: Address, selector: Hex): Promise<Hex[] | null> {
  try {
    const r = await ctx.client.call({ to, data: selector })
    if (!r.data || r.data.length < 2 + 64 * 2) return null
    const body = r.data.slice(2)
    const words: Hex[] = []
    for (let i = 0; i + 64 <= body.length; i += 64) words.push(`0x${body.slice(i, i + 64)}`)
    return words
  } catch {
    return null
  }
}

const toInt24 = (w: Hex) => {
  const v = BigInt(w) & 0xffffffn
  return Number(v >= 0x800000n ? v - 0x1000000n : v)
}

export async function readPoolState(ctx: Context, pool: Address, kind: "v3" | "algebra"): Promise<PoolState> {
  // slot0() on UniV3/Slipstream, globalState() on Algebra: word0 sqrtPrice, word1 tick.
  const words = await rawWords(ctx, pool, kind === "v3" ? "0x3850c7bd" : "0xe76c01e4")
  if (!words) throw new Error("pool state unreadable")
  const [liquidity, token0, token1] = await Promise.all([
    ctx.client.readContract({ address: pool, abi: poolAbi, functionName: "liquidity" }),
    ctx.client.readContract({ address: pool, abi: poolAbi, functionName: "token0" }),
    ctx.client.readContract({ address: pool, abi: poolAbi, functionName: "token1" }),
  ])
  let feePpm: number | null = null
  if (kind === "v3") {
    feePpm = await ctx.client.readContract({ address: pool, abi: poolAbi, functionName: "fee" }).then(Number).catch(() => null)
  } else if (words[2]) {
    // Algebra Integral: globalState word2 is lastFee in millionths.
    feePpm = Number(BigInt(words[2]) & 0xffffn)
  }
  const tickSpacing = await ctx.client
    .readContract({ address: pool, abi: poolAbi, functionName: "tickSpacing" })
    .then(Number)
    .catch(() => null)
  return {
    sqrtPriceX96: BigInt(words[0]!) & ((1n << 160n) - 1n),
    tick: toInt24(words[1]!),
    liquidity,
    token0,
    token1,
    feePpm,
    tickSpacing,
  }
}

/** Longest time-weighted average window this pool can serve right now. */
export async function maxReadableHistory(ctx: Context, pool: Address, kind: "v3" | "algebra"): Promise<number> {
  let target: Address = pool
  if (kind === "algebra") {
    target = await ctx.client.readContract({ address: pool, abi: poolAbi, functionName: "plugin" })
  }
  const res = await ctx.client.multicall({
    allowFailure: true,
    contracts: HISTORY_PROBES.map((w) =>
      kind === "v3"
        ? { address: target, abi: poolAbi, functionName: "observe" as const, args: [[w, 0]] as const }
        : { address: target, abi: pluginAbi, functionName: "getTimepoints" as const, args: [[w, 0]] as const },
    ),
  })
  let max = 0
  res.forEach((r, i) => {
    if (r.status === "success") max = Math.max(max, HISTORY_PROBES[i]!)
  })
  return max
}

export interface MoveCost {
  /** Raw quote-token units needed to reach each multiple, including swap fees. */
  costRaw: Map<number, bigint>
  method: "tick_walk" | "approximate"
  note?: string
}

/**
 * Quote tokens needed to push the base token's pool price up by each multiple.
 * Exact tick walk on Uniswap V3-compatible pools; constant in-range liquidity otherwise.
 */
export async function costToMovePrice(
  ctx: Context,
  pool: Address,
  kind: "v3" | "algebra",
  state: PoolState,
  baseToken: Address,
  multiples: number[],
): Promise<MoveCost> {
  const baseIsToken0 = baseToken.toLowerCase() === state.token0.toLowerCase()
  const sorted = [...multiples].sort((a, b) => a - b)
  const targets = sorted.map((k) => targetSqrt(state.sqrtPriceX96, k, baseIsToken0))
  const feeMul = (x: bigint) =>
    state.feePpm != null && state.feePpm < 1_000_000 ? (x * 1_000_000n) / BigInt(1_000_000 - state.feePpm) : x

  const approximate = (note: string): MoveCost => {
    const costRaw = new Map<number, bigint>()
    sorted.forEach((k, i) => costRaw.set(k, feeMul(segmentCost(state.liquidity, state.sqrtPriceX96, targets[i]!, baseIsToken0))))
    return { costRaw, method: "approximate", note }
  }

  if (kind !== "v3" || state.tickSpacing == null || state.tickSpacing <= 0) {
    return approximate("Assumes the liquidity at the current price stays the same as the price moves.")
  }

  const spacing = state.tickSpacing
  const lastTarget = targets[targets.length - 1]!
  // Target tick bound (direction aware) from the furthest target.
  const tickBound = clampTick(sqrtToTickApprox(lastTarget))
  const up = baseIsToken0 // base token0 price up = tick up
  const compressedNow = Math.floor(state.tick / spacing)
  const compressedEnd = Math.floor(tickBound / spacing)
  const wordNow = compressedNow >> 8
  const wordEnd = compressedEnd >> 8
  const words: number[] = []
  for (let w = Math.min(wordNow, wordEnd); w <= Math.max(wordNow, wordEnd); w++) words.push(w)
  if (words.length > MAX_BITMAP_WORDS) {
    return approximate("Pool has very fine price steps; used the liquidity at the current price.")
  }

  let initialized: number[]
  try {
    const bitmaps = await ctx.client.multicall({
      allowFailure: false,
      contracts: words.map((w) => ({ address: pool, abi: poolAbi, functionName: "tickBitmap" as const, args: [w] as const })),
    })
    initialized = []
    words.forEach((w, i) => {
      const bm = bitmaps[i] as bigint
      if (bm === 0n) return
      for (let b = 0; b < 256; b++) if ((bm >> BigInt(b)) & 1n) initialized.push((w * 256 + b) * spacing)
    })
  } catch {
    return approximate("Could not read the pool's liquidity map; used the liquidity at the current price.")
  }

  // Ticks we will cross, in walking order.
  const crossing = up
    ? initialized.filter((t) => t > state.tick && t <= tickBound).sort((a, b) => a - b)
    : initialized.filter((t) => t <= state.tick && t >= tickBound).sort((a, b) => b - a)

  let nets: bigint[]
  try {
    nets = await Promise.all(crossing.map((t) => liquidityNetAt(ctx, pool, t)))
  } catch {
    return approximate("Could not read the pool's liquidity map; used the liquidity at the current price.")
  }

  const costRaw = new Map<number, bigint>()
  let L = state.liquidity
  let sqrtCur = state.sqrtPriceX96
  let spent = 0n
  let ti = 0
  for (let i = 0; i < sorted.length; i++) {
    const target = targets[i]!
    while (true) {
      const nextTick = crossing[ti]
      const sqrtNext = nextTick != null ? getSqrtRatioAtTick(nextTick) : null
      const reachesTarget = sqrtNext == null || (up ? sqrtNext >= target : sqrtNext <= target)
      const stop = reachesTarget ? target : sqrtNext!
      spent += segmentCost(L, sqrtCur, stop, baseIsToken0)
      sqrtCur = stop
      if (reachesTarget) break
      const net = nets[ti]!
      L = up ? L + net : L - net
      if (L < 0n) L = 0n
      ti++
    }
    costRaw.set(sorted[i]!, feeMul(spent))
  }
  return { costRaw, method: "tick_walk" }
}

async function liquidityNetAt(ctx: Context, pool: Address, tick: number): Promise<bigint> {
  // ticks(int24): word0 liquidityGross, word1 liquidityNet (UniV3 and Slipstream layouts agree).
  const sel = "0xf30dba93"
  const arg = BigInt.asUintN(256, BigInt(tick)).toString(16).padStart(64, "0")
  const r = await ctx.client.call({ to: pool, data: `${sel}${arg}` as Hex })
  if (!r.data) throw new Error("ticks() empty")
  const [, net] = decodeAbiParameters([{ type: "uint128" }, { type: "int128" }], r.data.slice(0, 2 + 128) as Hex)
  return net
}

/** Quote amount to move from sqrtA to sqrtB with liquidity L (raw units). */
function segmentCost(L: bigint, sqrtA: bigint, sqrtB: bigint, baseIsToken0: boolean): bigint {
  if (L === 0n || sqrtA === sqrtB) return 0n
  if (baseIsToken0) {
    // price up, quote is token1: Δy = L·(√B − √A) / Q96
    return sqrtB > sqrtA ? (L * (sqrtB - sqrtA)) / Q96 : 0n
  }
  // base token1 price up = sqrt price down, quote is token0: Δx = L·Q96·(√A − √B) / (√A·√B)
  return sqrtA > sqrtB ? (L * Q96 * (sqrtA - sqrtB)) / (sqrtA * sqrtB) : 0n
}

function targetSqrt(sqrt: bigint, k: number, baseIsToken0: boolean): bigint {
  const s = BigInt(Math.round(Math.sqrt(k) * 1e9))
  return baseIsToken0 ? (sqrt * s) / 1_000_000_000n : (sqrt * 1_000_000_000n) / s
}

function sqrtToTickApprox(sqrt: bigint): number {
  const ratio = Number(sqrt) / Number(Q96)
  return Math.floor(Math.log(ratio * ratio) / Math.log(1.0001))
}

const clampTick = (t: number) => Math.max(MIN_TICK, Math.min(MAX_TICK, t))

export async function tokenDecimals(ctx: Context, token: Address): Promise<number> {
  const known = ctx.assets.get(token.toLowerCase())
  if (known) return known.decimals
  return ctx.client.readContract({ address: token, abi: erc20Abi, functionName: "decimals" })
}

export async function tokenSymbol(ctx: Context, token: Address): Promise<string | null> {
  const known = ctx.assets.get(token.toLowerCase())
  if (known) return known.symbol
  return ctx.client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" }).catch(() => null)
}
