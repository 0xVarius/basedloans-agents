import { z } from "zod"

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/)
const amount = z.string().regex(/^\d+(\.\d+)?$/)
const token = z.string().min(1).describe("Token contract address on Base (preferred) or symbol, e.g. WETH, VIRTUAL")
const term = z.enum(["short", "medium", "long"]).describe("Loan term. Durations and buyback costs come from get_protocol_info")

export const EmptySchema = z.object({}).strip().describe("No input")

export const ListMarketsSchema = z
  .object({ onlyWithFunds: z.boolean().optional().describe("Only tokens with USDC available to borrow right now") })
  .strip()

export const TokenSchema = z.object({ token }).strip()

export const QuoteSchema = z
  .object({
    token,
    collateralAmount: amount.describe("Collateral to offer, in token units, e.g. 0.5"),
    loanAmountUsdc: amount.optional().describe("Loan amount before the fee. Omit to borrow the most the collateral allows"),
    term,
  })
  .strip()

export const BuybackSchema = z
  .object({
    loanId: z.string().regex(/^\d+$/).describe("Loan ID from get_my_loans"),
    paymentUsdc: amount.optional().describe("USDC to pay. Omit to pay everything left and get all collateral back"),
  })
  .strip()

const limits = z
  .array(z.object({ token, limitUsdc: amount.describe("Max USDC to lend against this token; 0 removes it") }).strip())
  .min(1)
  .max(50)

export const LendSchema = z
  .object({
    amountUsdc: amount.describe("USDC to deposit"),
    limits: limits.optional().describe("Per-token lending limits. A first deposit needs at least one to start lending"),
  })
  .strip()

export const LimitsSchema = z.object({ limits }).strip()

export const WithdrawSchema = z
  .object({
    amountUsdc: z.union([amount, z.literal("max")]).describe('USDC to withdraw, or "max"'),
    asMusdc: z.boolean().optional().describe("Receive mUSDC vault shares instead (no 0.25% withdrawal fee)"),
  })
  .strip()

export const LoanIdsSchema = z
  .object({
    loanIds: z.array(z.string().regex(/^\d+$/)).min(1).max(50),
    mode: z.enum(["withdraw", "redeploy"]).optional().describe("For proceeds: withdraw to wallet (default) or re-lend"),
  })
  .strip()

export const RequestTokenSchema = z.object({ token: address.describe("Token contract address on Base") }).strip()
