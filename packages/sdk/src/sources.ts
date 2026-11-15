import { decodeAbiParameters, type Address, type Hex } from "viem"
import { ADAPTER_KINDS, DIA_DATA_BYTES, ZERO_ADDRESS } from "./constants.js"
import type { PricingType, SourceKind } from "./types.js"

export interface RawSource {
  adapter: Address
  data: Hex
  sourceType: number
}

export interface DecodedSource {
  kind: SourceKind
  adapter: Address
  pool?: Address
  twapWindowSeconds?: number
  baseToken?: Address
  quoteToken?: Address
  quoteVault?: Address
  hopPool?: Address
  hopQuote?: Address
  ratioContract?: Address
  fixedRatio?: number
}

const byteLen = (h: Hex) => (h.length - 2) / 2

export function decodeSource(s: RawSource): DecodedSource {
  const known = ADAPTER_KINDS[s.adapter.toLowerCase()]
  const kind: SourceKind = known ?? (byteLen(s.data) === DIA_DATA_BYTES ? "dia" : "unknown")
  const out: DecodedSource = { kind, adapter: s.adapter }
  try {
    if (kind === "dex_twap_uniswap_v3" || kind === "dex_twap_algebra") {
      const [pool, win, baseToken, quoteToken] = decodeAbiParameters(
        [{ type: "address" }, { type: "uint32" }, { type: "address" }, { type: "address" }],
        s.data,
      )
      Object.assign(out, { pool, twapWindowSeconds: Number(win), baseToken, quoteToken })
      if (byteLen(s.data) >= 160) {
        const v = decodeAbiParameters(
          [{ type: "address" }, { type: "uint32" }, { type: "address" }, { type: "address" }, { type: "address" }],
          s.data,
        )
        if (v[4] !== ZERO_ADDRESS) out.quoteVault = v[4]
      }
      if (byteLen(s.data) >= 224) {
        const v = decodeAbiParameters(
          [
            { type: "address" }, { type: "uint32" }, { type: "address" }, { type: "address" },
            { type: "address" }, { type: "address" }, { type: "address" },
          ],
          s.data,
        )
        if (v[5] !== ZERO_ADDRESS) {
          out.hopPool = v[5]
          out.hopQuote = v[6]
        }
      }
    } else if (kind === "derived_ratio") {
      const [baseToken, , ratioContract, precision] = decodeAbiParameters(
        [{ type: "address" }, { type: "uint256" }, { type: "address" }, { type: "uint256" }, { type: "bytes4" }],
        s.data,
      )
      out.baseToken = baseToken
      if (ratioContract === ZERO_ADDRESS) {
        const v = decodeAbiParameters(
          [
            { type: "address" }, { type: "uint256" }, { type: "address" }, { type: "uint256" },
            { type: "bytes4" }, { type: "uint256" },
          ],
          s.data,
        )
        out.fixedRatio = Number(v[5]) / Number(precision)
      } else {
        out.ratioContract = ratioContract
      }
    }
  } catch {
    // Leave partially decoded; the source is still reported with its kind.
  }
  return out
}

export function classifyPricing(sources: DecodedSource[]): PricingType {
  const live = sources.filter((s) => s.kind !== "pyth_retired")
  if (live.some((s) => s.kind === "derived_ratio" && s.fixedRatio != null)) return "derived_fixed_ratio"
  if (live.some((s) => s.kind === "derived_ratio")) return "derived_live_ratio"
  if (live.some((s) => s.hopPool)) return "market_two_hop"
  return "market"
}
