import { encodeAbiParameters, encodeErrorResult, encodePacked, type Hex } from "viem"
import { describe, expect, it } from "vitest"
import { coreAbi } from "../abis/core.js"
import { ledgerAbi } from "../abis/ledger.js"
import { createContext } from "../context.js"
import { decodeBasedLoansError } from "../errors.js"
import { classifyPricing, decodeSource } from "../sources.js"
import { getSqrtRatioAtTick, MAX_TICK, MIN_TICK, Q96 } from "../tickMath.js"
import { bpsToPercent, toRaw } from "../units.js"

describe("tickMath", () => {
  it("matches Uniswap reference values", () => {
    expect(getSqrtRatioAtTick(0)).toBe(Q96)
    expect(getSqrtRatioAtTick(MIN_TICK)).toBe(4295128739n)
    expect(getSqrtRatioAtTick(MAX_TICK)).toBe(1461446703485210103287273052203988822378723970342n)
    // From the Uniswap V3 TickMath tests.
    expect(getSqrtRatioAtTick(50)).toBe(79426470787362580746886972461n)
    expect(getSqrtRatioAtTick(-50)).toBe(79030349367926598376800521322n)
  })
  it("rejects out-of-range ticks", () => {
    expect(() => getSqrtRatioAtTick(MAX_TICK + 1)).toThrow()
    expect(() => getSqrtRatioAtTick(1.5)).toThrow()
  })
})

describe("units", () => {
  it("parses decimals and keeps bigints raw", () => {
    expect(toRaw("12.5", 6)).toBe(12_500_000n)
    expect(toRaw("0.000001", 6)).toBe(1n)
    expect(toRaw(3n, 18)).toBe(3n)
    expect(toRaw(1.5, 6)).toBe(1_500_000n)
  })
  it("rejects malformed amounts", () => {
    expect(() => toRaw("1e6", 6)).toThrow()
    expect(() => toRaw("-1", 6)).toThrow()
    expect(() => toRaw("abc", 6)).toThrow()
  })
  it("formats bps", () => {
    expect(bpsToPercent(249)).toBe("2.49%")
    expect(bpsToPercent(1000)).toBe("10%")
  })
})

const V3 = "0xfcDafF6e23d22d430A19aabDefDb9B2Aa2975ba2"
const RATIO = "0xB5391e137cd3Bb9dda02c164B599c95Af0F88b52"
const PYTH = "0x85Ad3d6817646143e7076096D4A053ED38eFc958"
const A = "0x1111111111111111111111111111111111111111"
const B = "0x2222222222222222222222222222222222222222"
const POOL = "0x3333333333333333333333333333333333333333"
const ZERO = "0x0000000000000000000000000000000000000000"

describe("source decoding", () => {
  it("decodes a direct V3 TWAP source", () => {
    const data = encodeAbiParameters([{ type: "address" }, { type: "uint32" }, { type: "address" }, { type: "address" }], [POOL, 1800, A, B])
    const d = decodeSource({ adapter: V3, data, sourceType: 1 })
    expect(d).toMatchObject({ kind: "dex_twap_uniswap_v3", pool: POOL, twapWindowSeconds: 1800, baseToken: A, quoteToken: B })
    expect(classifyPricing([d])).toBe("market")
  })
  it("detects two-hop sources", () => {
    const data = encodeAbiParameters(
      [{ type: "address" }, { type: "uint32" }, { type: "address" }, { type: "address" }, { type: "address" }, { type: "address" }, { type: "address" }],
      [POOL, 1800, A, B, ZERO, POOL, A],
    )
    const d = decodeSource({ adapter: V3, data, sourceType: 2 })
    expect(d.hopPool).toBe(POOL)
    expect(classifyPricing([d])).toBe("market_two_hop")
  })
  it("decodes fixed and live ratio sources", () => {
    const sentinel = 2n ** 32n - 1n
    const fixed = encodeAbiParameters(
      [{ type: "address" }, { type: "uint256" }, { type: "address" }, { type: "uint256" }, { type: "bytes4" }, { type: "uint256" }],
      [A, sentinel, ZERO, 10n ** 18n, "0x00000000", 85n * 10n ** 16n],
    )
    const f = decodeSource({ adapter: RATIO, data: fixed, sourceType: 1 })
    expect(f.fixedRatio).toBeCloseTo(0.85)
    expect(classifyPricing([f])).toBe("derived_fixed_ratio")
    const live = encodeAbiParameters(
      [{ type: "address" }, { type: "uint256" }, { type: "address" }, { type: "uint256" }, { type: "bytes4" }],
      [A, sentinel, B, 10n ** 18n, "0x20f4d7aa"],
    )
    const l = decodeSource({ adapter: RATIO, data: live, sourceType: 1 })
    expect(l.ratioContract).toBe(B)
    expect(classifyPricing([l])).toBe("derived_live_ratio")
  })
  it("recognises DIA by its 57-byte layout and Pyth as retired", () => {
    const dia = encodePacked(["address", "uint32", "uint8", "bytes32"], [B, 86400, 18, `0x${"44".repeat(32)}` as Hex])
    expect(decodeSource({ adapter: A, data: dia, sourceType: 0 }).kind).toBe("dia")
    expect(decodeSource({ adapter: PYTH, data: "0x", sourceType: 0 }).kind).toBe("pyth_retired")
  })
})

describe("error decoding", () => {
  it("maps Core and ledger reverts to plain messages", () => {
    const tooSmall = encodeErrorResult({ abi: coreAbi, errorName: "LoanTooSmall", args: [10n, 50_000_000n] })
    expect(decodeBasedLoansError(tooSmall)?.name).toBe("LoanTooSmall")
    expect(decodeBasedLoansError(tooSmall)?.message).toMatch(/minimum/)
    const expired = encodeErrorResult({ abi: coreAbi, errorName: "LoanExpired" })
    expect(decodeBasedLoansError(expired)?.message).toMatch(/due date/)
    const notEnough = encodeErrorResult({ abi: ledgerAbi, errorName: "InsufficientUnlockedBalance" })
    expect(decodeBasedLoansError(notEnough)?.message).toMatch(/active loans/)
  })
  it("returns null for unknown data", () => {
    expect(decodeBasedLoansError("0xdeadbeef")).toBeNull()
  })
})

describe("builder code", () => {
  it("encodes the ERC-8021 suffix exactly as Base documents", () => {
    const ctx = createContext({ builderCode: "bc_b7k3p9da", rpcUrl: "http://127.0.0.1:1" })
    expect(ctx.dataSuffix).toBe("0x62635f62376b33703964610b0080218021802180218021802180218021")
  })
  it("can be disabled and rejects junk", () => {
    expect(createContext({ builderCode: null, rpcUrl: "http://127.0.0.1:1" }).dataSuffix).toBeUndefined()
    expect(() => createContext({ builderCode: "bad code!", rpcUrl: "http://127.0.0.1:1" })).toThrow()
  })
})
