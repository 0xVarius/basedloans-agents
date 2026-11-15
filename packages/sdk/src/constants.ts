import type { Address } from "viem"
import type { SourceKind, TermName } from "./types.js"

export const BASE_CHAIN_ID = 8453

/** Core is the root address. Every other contract is read from it at runtime. */
export const BASE_CORE: Address = "0x88Df29c4c2D564A2996d99bbe3C85da505881Aa3"

export const BASE_USDC: Address = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
export const BASE_WETH: Address = "0x4200000000000000000000000000000000000006"

/**
 * Based Loans' Base Builder Code (ERC-8021 attribution), registered to the Labs operator Safe
 * 0x3970a7372566ad1Fb888a8240A89662A5D2455E5. Appended to every transaction the SDK builds
 * unless the caller passes builderCode: null.
 */
export const BASEDLOANS_BUILDER_CODE: string | null = "bc_7x4gwndk"

export const SITE_URL = "https://based.loans"
export const TOKEN_REQUEST_URL = `${SITE_URL}/list`

/** Price adapters approved on Base mainnet, by lowercase address. */
export const ADAPTER_KINDS: Record<string, SourceKind> = {
  "0xfcdaff6e23d22d430a19aabdefdb9b2aa2975ba2": "dex_twap_uniswap_v3",
  "0x218cdfd5802ff3d6a22ffb14a41c3311ebfc2908": "dex_twap_algebra",
  "0x85ad3d6817646143e7076096d4a053ed38efc958": "pyth_retired",
  "0xb5391e137cd3bb9dda02c164b599c95af0f88b52": "derived_ratio",
}

/** DIA sources use a 57-byte packed config; any approved adapter with that layout is DIA. */
export const DIA_DATA_BYTES = 57

export const TERM_NAMES: readonly TermName[] = ["short", "medium", "long"]

/** Use the protocol's default shortfall tolerance (Core.USE_GLOBAL_SHORTFALL). */
export const USE_GLOBAL_SHORTFALL = 65535

export const BPS = 10_000n
export const USDC_DECIMALS = 6

/** Price-move cost thresholds used for THIN_MARKET flags, in USD to double the pool price. */
export const VERY_THIN_COST_USD = 2_500
export const THIN_COST_USD = 25_000

export const ZERO_ADDRESS: Address = "0x0000000000000000000000000000000000000000"
