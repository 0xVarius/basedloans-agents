import type { Address } from "viem"
import { BPS, USDC_DECIMALS } from "./constants.js"
import type { Context } from "./context.js"
import { BasedLoansError } from "./errors.js"
import { previewFill } from "./fill.js"
import { getMarketInternal } from "./markets.js"
import { getProtocolParams, resolveTerm } from "./protocol.js"
import type { BorrowQuote } from "./types.js"
import { fromRaw, isoDate, toRaw, type AmountInput } from "./units.js"

export interface QuoteBorrowInput {
  asset: Address
  /** Collateral to offer, in token units ("1.5") or raw bigint. Acts as a maximum. */
  collateralAmount: AmountInput
  /** Optional loan amount before fee, in USDC. Omit to borrow the most the collateral allows. */
  loanAmountUsdc?: AmountInput
  /** 0/1/2 or "short"/"medium"/"long". */
  term: number | string
  /** Shortfall tolerance to check against, in basis points. Defaults to the protocol default. */
  maxShortfallBps?: number
}

const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b

/**
 * Mirrors Core.openLoan's sizing math against live state. The real fill depends on lender
 * caps at execution time, so the funded amount can still come in lower (a partial fill).
 */
export async function quoteBorrow(ctx: Context, input: QuoteBorrowInput): Promise<BorrowQuote> {
  const [mi, params] = await Promise.all([getMarketInternal(ctx, input.asset), getProtocolParams(ctx)])
  if (!mi) throw new BasedLoansError("This token is not set up on Based Loans. Use requestTokenListing to ask for it.", "ASSET_NOT_CONFIGURED")
  const { cfg, report, meta } = mi
  if (params.paused) throw new BasedLoansError("Based Loans is paused right now.", "PAUSED")
  if (!cfg.isActive) throw new BasedLoansError(`${meta.symbol} is not currently accepted as collateral.`, "ASSET_INACTIVE")
  if (!report || report.validCount < cfg.minSources || report.minPriceUsdc18 === 0n) {
    throw new BasedLoansError(`Not enough working price sources for ${meta.symbol} right now.`, "PRICE_UNAVAILABLE")
  }
  if (report.deviationBps > cfg.maxDeviationBps) {
    throw new BasedLoansError(`${meta.symbol}'s price sources disagree too much right now.`, "PRICE_DEVIATION")
  }

  const term = resolveTerm(params.terms, input.term)
  const collateralAmount = toRaw(input.collateralAmount, meta.decimals)
  if (collateralAmount === 0n) throw new BasedLoansError("Collateral amount cannot be zero.", "ZERO_AMOUNT")

  const price = report.minPriceUsdc18
  const tokenScale = 10n ** BigInt(meta.decimals)
  const ltv = BigInt(cfg.maxLtvBps)
  const collateralValue = (price * collateralAmount) / (tokenScale * 10n ** 12n)
  const maxPrincipal = (collateralValue * ltv) / BPS

  let target: bigint
  let needed: bigint
  const requested = input.loanAmountUsdc != null ? toRaw(input.loanAmountUsdc, USDC_DECIMALS) : 0n
  if (requested > 0n) {
    needed = ceilDiv(requested * BPS * tokenScale * 10n ** 12n, ltv * price)
    if (needed <= collateralAmount) {
      target = requested
    } else {
      target = maxPrincipal
      needed = collateralAmount
    }
  } else {
    target = maxPrincipal
    needed = collateralAmount
  }

  // Replay the contract's lender-queue walk so the funded amount is what openLoan will really get.
  const fill = await previewFill(ctx, mi.market.asset, target)
  const funded = fill.funded
  const warnings: string[] = []
  let fullFillLoanAmountUsdc: string | null = null
  if (fill.stopReason === "below_min_fill" && funded > 0n) {
    fullFillLoanAmountUsdc = fromRaw(funded, USDC_DECIMALS)
    warnings.push(
      `Lenders are not added once less than ${fromRaw(fill.minAssetCap, USDC_DECIMALS)} USDC is still needed, so only ${fromRaw(funded, USDC_DECIMALS)} USDC would be funded. Ask for ${fullFillLoanAmountUsdc} USDC (or at least ${fromRaw(funded + fill.minAssetCap, USDC_DECIMALS)}) to avoid a short loan.`,
    )
  }
  // Conditions under which openLoan is certain to revert at the current state.
  let wouldFail: string | null = null
  const minLoan = toRaw(params.minLoanUsdc, USDC_DECIMALS)
  if (funded < minLoan) {
    wouldFail =
      funded === 0n && target < minLoan
        ? `This collateral supports at most ${fromRaw(target, USDC_DECIMALS)} USDC, below the ${params.minLoanUsdc} USDC minimum loan. Offer more collateral.`
        : `Only ${fromRaw(funded, USDC_DECIMALS)} USDC can be funded right now, below the ${params.minLoanUsdc} USDC minimum loan.`
  }
  if (fill.stopReason === "queue_too_long") {
    // The preview stopped walking before the contract would; the real fill may be larger.
    warnings.push("The lender queue is very long, so this quote may understate how much would be funded.")
  }
  const partial = funded < target
  const allowedShortBps = input.maxShortfallBps ?? params.defaultMaxShortfallBps
  if (partial && target > 0n) {
    const shortBps = Number(((target - funded) * BPS) / target)
    warnings.push(
      `Lenders can fund ${fromRaw(funded, USDC_DECIMALS)} of ${fromRaw(target, USDC_DECIMALS)} USDC requested (${shortBps / 100}% short).`,
    )
    if (shortBps > allowedShortBps && !wouldFail && fill.stopReason !== "queue_too_long") {
      wouldFail = `Funding would be ${shortBps / 100}% short of the request, more than the ${allowedShortBps / 100}% allowed.${fullFillLoanAmountUsdc ? ` Ask for ${fullFillLoanAmountUsdc} USDC instead.` : ""}`
    }
  }
  if (cfg.maxExposureUsdc > 0n && !wouldFail) {
    const used = toRaw(mi.market.activeLoansUsdc, USDC_DECIMALS)
    if (used + funded > cfg.maxExposureUsdc) wouldFail = `This would go over ${meta.symbol}'s active loan limit. Try a smaller amount.`
  }
  if (wouldFail) warnings.unshift(`This loan would fail: ${wouldFail}`)

  const collateralUsed = partial && target > 0n ? ceilDiv(needed * funded, target) : needed
  const fee = ceilDiv(funded * BigInt(params.loanFeeBps), BPS)
  const buyback = funded + (funded * BigInt(term.buybackCostBps)) / BPS

  return {
    asset: mi.market.asset,
    symbol: meta.symbol,
    term,
    priceUsd: Number(price) / 1e18,
    collateralValueUsd: Number(collateralValue) / 1e6,
    maxLtvBps: cfg.maxLtvBps,
    collateralUsed: fromRaw(collateralUsed, meta.decimals),
    collateralUsedRaw: collateralUsed.toString(),
    loanAmountUsdc: fromRaw(funded, USDC_DECIMALS),
    loanAmountUsdcRaw: funded.toString(),
    feeUsdc: fromRaw(fee, USDC_DECIMALS),
    youReceiveUsdc: fromRaw(funded - fee, USDC_DECIMALS),
    buybackCostUsdc: fromRaw(buyback, USDC_DECIMALS),
    buybackCostUsdcRaw: buyback.toString(),
    estimatedDueDate: isoDate(params.blockTimestamp + term.durationSeconds),
    availableToBorrowUsdc: mi.market.availableToBorrowUsdc,
    partialFill: partial,
    fullFillLoanAmountUsdc,
    lendersFunding: fill.lenders.length,
    wouldFail,
    warnings,
  }
}
