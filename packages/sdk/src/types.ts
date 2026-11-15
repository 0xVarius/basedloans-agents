import type { Address, Hex } from "viem"

/** Static metadata for a collateral token. Status and risk are always read live. */
export interface KnownAsset {
  address: Address
  symbol: string
  name: string
  decimals: number
}

/** A transaction ready to be signed by the caller's wallet. The SDK never signs. */
export interface UnsignedTransaction {
  chainId: number
  to: Address
  data: Hex
  value: string
  /** Plain-language summary of what this transaction does. */
  description: string
}

/** A multi-step action: run `steps` in order. Approvals come first when needed. */
export interface TransactionPlan {
  steps: UnsignedTransaction[]
  /** Short plain-language summary of the whole action. */
  summary: string
  /** Things the signer should know before sending. */
  warnings: string[]
}

export type TermName = "short" | "medium" | "long"

export interface Term {
  index: 0 | 1 | 2
  name: TermName
  durationSeconds: number
  durationDays: number
  /** Buyback cost on top of the loan amount, in basis points. */
  buybackCostBps: number
}

export interface ProtocolParams {
  chainId: number
  blockNumber: string
  blockTimestamp: number
  paused: boolean
  contracts: ContractAddresses
  /** Fee taken from each new loan, in basis points (rounded up on-chain). */
  loanFeeBps: number
  terms: Term[]
  minLoanUsdc: string
  minBuybackUsdc: string
  /** Default maximum shortfall between requested and funded amount, in basis points. */
  defaultMaxShortfallBps: number
  minDepositUsdc: string
  minAssetCapUsdc: string
  maxAssetCapUsdc: string
  maxLendersPerFill: number
  maxLenderAssets: number
}

export interface ContractAddresses {
  core: Address
  ledger: Address
  assetManager: Address
  oracleManager: Address
  feeDistributor: Address
  usdc: Address
  vault: Address
}

export type SourceKind =
  | "dex_twap_uniswap_v3"
  | "dex_twap_algebra"
  | "dia"
  | "pyth_retired"
  | "derived_ratio"
  | "unknown"

export type PricingType =
  /** Priced directly from one or more markets (DEX time-weighted average and/or DIA). */
  | "market"
  /** Priced through an intermediate token, e.g. TOKEN/X then X/WETH. */
  | "market_two_hop"
  /** A share, staked or liquid-staking token: base token price × an exchange rate read live. */
  | "derived_live_ratio"
  /** An escrowed or locked token: base token price × a fixed ratio set by governance. */
  | "derived_fixed_ratio"

export interface PriceSourceInfo {
  kind: SourceKind
  adapter: Address
  /** Whether the source returned a usable price right now. */
  live: boolean
  priceUsd: number | null
  pool?: Address
  twapWindowSeconds?: number
  twoHop?: boolean
  quoteToken?: Address
  /** For derived tokens. */
  baseToken?: Address
  ratioContract?: Address
  fixedRatio?: number
}

export interface Market {
  asset: Address
  symbol: string
  name: string
  decimals: number
  active: boolean
  priceUsd: number | null
  /** Max loan as a share of collateral value, in basis points. */
  maxLtvBps: number
  /** USDC currently available to borrow against this token (capped by the vault). */
  availableToBorrowUsdc: string
  lendersAvailable: number
  /** USDC in active loans against this token. */
  activeLoansUsdc: string
  /** Protocol-wide cap on active loans for this token. "0" means no cap. */
  activeLoanCapUsdc: string
  pricingType: PricingType
  minSources: number
  maxDeviationBps: number
}

export type RiskFlag =
  | "ASSET_INACTIVE"
  | "SINGLE_PRICE_SOURCE"
  | "PRICE_SOURCE_DOWN"
  | "PRICE_UNAVAILABLE"
  | "VERY_THIN_MARKET"
  | "THIN_MARKET"
  | "CHEAP_TO_MOVE_PRICE"
  | "NO_ACTIVE_LOAN_CAP"
  | "DERIVED_PRICE"
  | "FIXED_RATIO_PRICE"
  | "COLLATERAL_MAY_NOT_BE_LIQUID"

export interface PoolDepth {
  pool: Address
  kind: "uniswap_v3_compatible" | "algebra"
  /** "tick_walk" is exact for the liquidity on-chain now; "approximate" assumes constant in-range liquidity. */
  method: "tick_walk" | "approximate"
  quoteToken: Address
  quoteSymbol: string | null
  feeBps: number | null
  /** Longest time-weighted average this pool can serve right now, in seconds. */
  maxReadableHistorySeconds: number
  /** Quote tokens (in USD) needed to push the token's pool price up 2× and 10×, including swap fees. */
  costToDoublePriceUsd: number | null
  costToTenXPriceUsd: number | null
  note?: string
}

export interface RiskReport {
  asset: Address
  symbol: string
  pricingType: PricingType
  /** One-paragraph plain-language summary. */
  summary: string
  flags: RiskFlag[]
  /** Severity of the worst flag. Informational only, never a recommendation. */
  level: "low" | "medium" | "high"
  minSources: number
  liveSources: number
  /** True when two or more live sources must agree within maxDeviationBps. */
  crossCheckActive: boolean
  maxDeviationBps: number
  sources: PriceSourceInfo[]
  pools: PoolDepth[]
  availableToBorrowUsdc: string
  activeLoanCapUsdc: string
  explanations: Partial<Record<RiskFlag, string>>
}

export interface BorrowQuote {
  asset: Address
  symbol: string
  term: Term
  priceUsd: number
  collateralValueUsd: number
  maxLtvBps: number
  /** Collateral the contract will take (may be less than offered on a partial fill). */
  collateralUsed: string
  collateralUsedRaw: string
  /** Loan amount before the fee. */
  loanAmountUsdc: string
  loanAmountUsdcRaw: string
  feeUsdc: string
  /** USDC that lands in the borrower's wallet. */
  youReceiveUsdc: string
  /** Total to pay to get all collateral back before the due date. */
  buybackCostUsdc: string
  buybackCostUsdcRaw: string
  estimatedDueDate: string
  availableToBorrowUsdc: string
  partialFill: boolean
  /** When matching would stop short, a loan amount that fills completely. Otherwise null. */
  fullFillLoanAmountUsdc: string | null
  lendersFunding: number
  /** Why opening this loan right now would revert, or null if it should go through. */
  wouldFail: string | null
  warnings: string[]
}

export type LoanStatus = "active" | "partially_repaid" | "repaid" | "defaulted"

export interface Loan {
  loanId: string
  borrower: Address
  asset: Address
  symbol: string | null
  status: LoanStatus
  collateralAmount: string
  collateralRemaining: string
  loanAmountUsdc: string
  buybackCostUsdc: string
  buybackRemainingUsdc: string
  createdAt: string
  dueDate: string
  secondsUntilDue: number
  lenders: { lender: Address; amountUsdc: string }[]
}

export interface LenderPosition {
  lender: Address
  depositedUsdc: string
  inActiveLoansUsdc: string
  availableToWithdrawUsdc: string
  autoRedeploy: boolean
  assets: {
    asset: Address
    symbol: string | null
    capUsdc: string
    inActiveLoansUsdc: string
    remainingCapUsdc: string
    waitingToLend: boolean
  }[]
  loans: {
    loanId: string
    asset: Address
    symbol: string | null
    status: LoanStatus
    fundedUsdc: string
    claimableProceedsUsdc: string
    claimableCollateral: string
  }[]
}
