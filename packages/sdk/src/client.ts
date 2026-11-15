import type { Address } from "viem"
import { createContext, type BasedLoansOptions, type Context } from "./context.js"
import { requestTokenListing } from "./listing.js"
import { getMarket, listMarkets } from "./markets.js"
import { getBorrowerLoans, getLenderPosition, getLoan } from "./positions.js"
import { getProtocolParams } from "./protocol.js"
import { quoteBorrow, type QuoteBorrowInput } from "./quote.js"
import { getRiskReport, type RiskOptions } from "./risk.js"
import { simulateTransaction } from "./simulate.js"
import {
  buildBorrow,
  buildBuyback,
  buildClaimCollateral,
  buildClaimProceeds,
  buildDeposit,
  buildSetAutoRedeploy,
  buildSetLimits,
  buildWithdraw,
  type BuildBorrowInput,
  type BuildBuybackInput,
  type BuildDepositInput,
  type BuildWithdrawInput,
  type TokenLimit,
} from "./tx.js"
import type { UnsignedTransaction } from "./types.js"

/** One object exposing every SDK capability. Read-only plus unsigned-transaction builders. */
export function createBasedLoans(opts: BasedLoansOptions = {}) {
  const ctx: Context = createContext(opts)
  return {
    ctx,
    getProtocolParams: () => getProtocolParams(ctx),
    listMarkets: (o?: { includeInactive?: boolean; onlyWithFunds?: boolean }) => listMarkets(ctx, o),
    getMarket: (asset: Address) => getMarket(ctx, asset),
    getRiskReport: (asset: Address, o?: RiskOptions) => getRiskReport(ctx, asset, o),
    quoteBorrow: (i: QuoteBorrowInput) => quoteBorrow(ctx, i),
    getLoan: (id: bigint | number | string) => getLoan(ctx, id),
    getBorrowerLoans: (borrower: Address) => getBorrowerLoans(ctx, borrower),
    getLenderPosition: (lender: Address) => getLenderPosition(ctx, lender),
    requestTokenListing: (token: string) => requestTokenListing(ctx, token),
    buildBorrow: (i: BuildBorrowInput) => buildBorrow(ctx, i),
    buildBuyback: (i: BuildBuybackInput) => buildBuyback(ctx, i),
    buildDeposit: (i: BuildDepositInput) => buildDeposit(ctx, i),
    buildSetLimits: (i: { limits: TokenLimit[]; lender?: Address }) => buildSetLimits(ctx, i),
    buildWithdraw: (i: BuildWithdrawInput) => buildWithdraw(ctx, i),
    buildClaimProceeds: (i: { loanIds: (bigint | number | string)[]; mode?: "withdraw" | "redeploy" }) => buildClaimProceeds(ctx, i),
    buildClaimCollateral: (i: { loanIds: (bigint | number | string)[] }) => buildClaimCollateral(ctx, i),
    buildSetAutoRedeploy: (i: { enabled: boolean }) => buildSetAutoRedeploy(ctx, i),
    simulate: (t: UnsignedTransaction, from: Address) => simulateTransaction(ctx, t, from),
  }
}

export type BasedLoans = ReturnType<typeof createBasedLoans>
