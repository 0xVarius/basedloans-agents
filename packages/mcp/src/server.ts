import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import {
  BasedLoansError,
  createBasedLoans,
  explainError,
  type BasedLoans,
  type BasedLoansOptions,
} from "@basedloans/sdk"
import { getAddress, isAddress, type Address, type Hex } from "viem"
import { z } from "zod"
import { COLLATERAL_TYPES_GUIDE, SERVER_INSTRUCTIONS } from "./text.js"

export const SERVER_NAME = "basedloans"
export const SERVER_VERSION = "0.1.0"

export interface ServerOptions extends BasedLoansOptions {
  /**
   * Expose only read tools (no transaction builders). Use for directories that do not accept
   * tools that prepare financial transactions.
   */
  readOnly?: boolean
}

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/, "a 0x-prefixed 20-byte address")
const assetRef = z
  .string()
  .min(1)
  .describe("Token contract address on Base (preferred) or its symbol, e.g. WETH, VIRTUAL, esALB")
const amount = z.string().regex(/^\d+(\.\d+)?$/, "a plain decimal like 12.5")
const term = z
  .union([z.enum(["short", "medium", "long"]), z.number().int().min(0).max(2)])
  .describe("Loan term: short, medium or long (or 0/1/2). Durations and costs come from get_protocol_info.")
const loanId = z.union([z.string().regex(/^\d+$/), z.number().int().nonnegative()]).describe("Loan ID")

const json = (v: unknown) =>
  JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? x.toString() : x), 2)

function ok(result: unknown) {
  return { content: [{ type: "text" as const, text: json(result) }] }
}

function fail(e: unknown) {
  const message =
    e instanceof BasedLoansError ? e.message : e instanceof Error && !("walk" in e) ? e.message : explainError(e).message
  return { isError: true, content: [{ type: "text" as const, text: message }] }
}

function resolveAsset(bl: BasedLoans, ref: string): Address {
  if (isAddress(ref)) return getAddress(ref)
  const want = ref.trim().toLowerCase()
  const matches = [...bl.ctx.assets.values()].filter((a) => a.symbol.toLowerCase() === want)
  if (matches.length === 1) return getAddress(matches[0]!.address)
  if (matches.length > 1) {
    throw new BasedLoansError(`More than one token is called ${ref}. Pass the contract address instead: ${matches.map((m) => m.address).join(", ")}`, "AMBIGUOUS")
  }
  throw new BasedLoansError(`No known token called "${ref}". Pass its contract address, or use request_token_listing.`, "UNKNOWN_TOKEN")
}

const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } as const
// Builders change nothing on-chain themselves: they return unsigned transactions for the user's wallet.
const BUILD = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } as const
const BUILD_META = { "basedloans/returns": "unsigned_transactions" }

export function createServer(opts: ServerOptions = {}): McpServer {
  const bl = createBasedLoans(opts)
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION, title: "Based Loans" },
    { instructions: SERVER_INSTRUCTIONS(opts.readOnly ?? false) },
  )

  const tool = <S extends z.ZodRawShape>(
    name: string,
    title: string,
    description: string,
    shape: S,
    annotations: typeof READ | typeof BUILD,
    run: (args: z.infer<z.ZodObject<S>>) => Promise<unknown>,
    meta?: Record<string, unknown>,
  ) =>
    server.registerTool(
      name,
      { title, description, inputSchema: shape, annotations: { title, ...annotations }, ...(meta ? { _meta: meta } : {}) },
      (async (args: z.infer<z.ZodObject<S>>) => {
        try {
          return ok(await run(args))
        } catch (e) {
          return fail(e)
        }
      }) as never,
    )

  // ── Read tools ──────────────────────────────────────────────────────────────
  tool(
    "get_protocol_info",
    "Protocol info",
    "Live protocol parameters: loan fee, the three loan terms with their durations and buyback costs, minimum loan and deposit sizes, per-token lending limit bounds, and whether the protocol is paused.",
    {},
    READ,
    () => bl.getProtocolParams(),
  )

  tool(
    "list_markets",
    "List collateral tokens",
    "Every token currently accepted as collateral, with price, max loan-to-value, USDC available to borrow against it, active loans, and how it is priced. Set only_with_funds to see only tokens lenders are currently backing.",
    { only_with_funds: z.boolean().optional().describe("Only tokens with USDC available to borrow right now") },
    READ,
    ({ only_with_funds }) => bl.listMarkets({ onlyWithFunds: only_with_funds }),
  )

  tool(
    "get_market",
    "Get one collateral token",
    "Price, max loan-to-value, USDC available to borrow, active loans and pricing type for one token.",
    { asset: assetRef },
    READ,
    async ({ asset }) => (await bl.getMarket(resolveAsset(bl, asset))) ?? { notListed: true, hint: "Use request_token_listing." },
  )

  tool(
    "get_risk_report",
    "Token risk report",
    "Live risk data for lending against (or borrowing with) a token: how many price sources it has and whether they cross-check each other, how far back its pool price history goes, how much trading it would take to move its pool price 2x and 10x, USDC available to borrow against it, its active loan limit, and plain-language explanations of every flag. Use this before setting a lending limit on a token.",
    { asset: assetRef, skip_depth: z.boolean().optional().describe("Skip the pool depth calculation (faster)") },
    READ,
    async ({ asset, skip_depth }) =>
      (await bl.getRiskReport(resolveAsset(bl, asset), { skipDepth: skip_depth })) ?? { notListed: true },
  )

  tool(
    "quote_borrow",
    "Quote a loan",
    "Exact loan quote using the same math the contract runs: USDC you receive after the fee, buyback cost, due date, and how much collateral is used. It replays the lender queue, so the funded amount matches what the loan would really get, and warns (with a suggested amount) when a loan would be funded short.",
    {
      asset: assetRef,
      collateral_amount: amount.describe("Collateral to offer, in token units, e.g. 0.5"),
      loan_amount_usdc: amount.optional().describe("Loan amount before the fee. Omit to borrow the most the collateral allows."),
      term,
    },
    READ,
    ({ asset, collateral_amount, loan_amount_usdc, term: t }) =>
      bl.quoteBorrow({ asset: resolveAsset(bl, asset), collateralAmount: collateral_amount, loanAmountUsdc: loan_amount_usdc, term: t }),
  )

  tool("get_loan", "Get a loan", "Status, collateral, buyback cost and remaining amount, due date and lenders for one loan.", { loan_id: loanId }, READ, async ({ loan_id }) =>
    (await bl.getLoan(loan_id)) ?? { notFound: true },
  )

  tool(
    "get_borrower_loans",
    "Borrower's loans",
    "Every loan a wallet has opened, with status (active, partially_repaid, repaid, defaulted), buyback remaining and time until due.",
    { borrower: address },
    READ,
    ({ borrower }) => bl.getBorrowerLoans(getAddress(borrower)),
  )

  tool(
    "get_lender_position",
    "Lender position",
    "A lender's deposit, USDC in active loans, USDC available to withdraw, per-token limits, and every loan they funded with any repaid USDC or defaulted collateral they can claim.",
    { lender: address },
    READ,
    ({ lender }) => bl.getLenderPosition(getAddress(lender)),
  )

  tool(
    "request_token_listing",
    "Request a new token",
    "Check whether a token is accepted as collateral. If it is not, returns a pre-filled link to the Based Loans request form for the user to open and submit. Nothing is submitted automatically.",
    { token: address.describe("Token contract address on Base") },
    READ,
    ({ token }) => bl.requestTokenListing(token),
  )

  tool(
    "explain_collateral_types",
    "Collateral types explained",
    "How Based Loans prices different kinds of collateral (regular tokens, two-hop priced tokens, staked and share tokens, escrowed tokens), with examples, and what each means for borrowers and lenders.",
    {},
    READ,
    async () => ({ guide: COLLATERAL_TYPES_GUIDE }),
  )

  if (opts.readOnly) return server

  // ── Transaction builders (unsigned; the user's wallet signs) ──────────────
  tool(
    "build_borrow",
    "Prepare a loan",
    "Returns the unsigned transactions to open a loan: an approval (only if needed) then openLoan. Includes the quote and warnings. The user's wallet must sign and send each step in order.",
    {
      asset: assetRef,
      collateral_amount: amount,
      loan_amount_usdc: amount.optional(),
      term,
      borrower: address.describe("Wallet that will sign; used to skip unneeded approvals and check balances"),
      max_shortfall_bps: z.number().int().min(0).max(10000).optional().describe("Max gap between requested and funded amount in basis points. Omit for the protocol default."),
    },
    BUILD,
    ({ asset, collateral_amount, loan_amount_usdc, term: t, borrower, max_shortfall_bps }) =>
      bl.buildBorrow({
        asset: resolveAsset(bl, asset),
        collateralAmount: collateral_amount,
        loanAmountUsdc: loan_amount_usdc,
        term: t,
        borrower: getAddress(borrower),
        maxShortfallBps: max_shortfall_bps,
      }),
    BUILD_META,
  )

  tool(
    "build_buyback",
    "Prepare a buyback",
    "Returns the unsigned transactions to pay back a loan and get collateral back: a USDC approval (only if needed) then buyback. Omit payment_usdc to pay the full remaining amount.",
    { loan_id: loanId, payment_usdc: amount.optional(), borrower: address },
    BUILD,
    ({ loan_id, payment_usdc, borrower }) => bl.buildBuyback({ loanId: loan_id, paymentUsdc: payment_usdc, borrower: getAddress(borrower) }),
    BUILD_META,
  )

  const limits = z
    .array(z.object({ asset: assetRef, limit_usdc: amount.describe("Max USDC to lend against this token; 0 removes it") }))
    .min(1)
    .max(50)

  tool(
    "build_deposit",
    "Prepare a lending deposit",
    "Returns the unsigned transactions to deposit USDC for lending, optionally setting per-token lending limits in the same transaction (needed before a first deposit can be lent). Check get_risk_report for each token first.",
    { amount_usdc: amount, lender: address, limits: limits.optional() },
    BUILD,
    ({ amount_usdc, lender, limits: l }) =>
      bl.buildDeposit({
        amountUsdc: amount_usdc,
        lender: getAddress(lender),
        limits: l?.map((x) => ({ asset: resolveAsset(bl, x.asset), limitUsdc: x.limit_usdc })),
      }),
    BUILD_META,
  )

  tool(
    "build_set_limits",
    "Prepare per-token lending limits",
    "Returns the unsigned transaction to add, change or remove per-token lending limits. A limit cannot be set below what is already in active loans for that token.",
    { limits, lender: address },
    BUILD,
    ({ limits: l, lender }) =>
      bl.buildSetLimits({ limits: l.map((x) => ({ asset: resolveAsset(bl, x.asset), limitUsdc: x.limit_usdc })), lender: getAddress(lender) }),
    BUILD_META,
  )

  tool(
    "build_withdraw",
    "Prepare a withdrawal",
    'Returns the unsigned transaction to withdraw USDC that is not in active loans. Use "max" for everything available. as_musdc receives vault shares and skips the 0.25% withdrawal fee.',
    { amount_usdc: z.union([amount, z.literal("max")]), lender: address, as_musdc: z.boolean().optional() },
    BUILD,
    ({ amount_usdc, lender, as_musdc }) => bl.buildWithdraw({ amountUsdc: amount_usdc, lender: getAddress(lender), asMusdc: as_musdc }),
    BUILD_META,
  )

  tool(
    "build_claim_proceeds",
    "Prepare a proceeds claim",
    "Returns the unsigned transaction to claim repaid USDC from loans you funded (mode withdraw) or put it straight back into lending (mode redeploy). Get loan IDs from get_lender_position.",
    { loan_ids: z.array(loanId).min(1).max(50), mode: z.enum(["withdraw", "redeploy"]).optional() },
    BUILD,
    ({ loan_ids, mode }) => bl.buildClaimProceeds({ loanIds: loan_ids, mode }),
    BUILD_META,
  )

  tool(
    "build_claim_collateral",
    "Prepare a collateral claim",
    "Returns the unsigned transaction for a lender to claim their share of collateral from loans that passed their due date without a full buyback.",
    { loan_ids: z.array(loanId).min(1).max(50) },
    BUILD,
    ({ loan_ids }) => bl.buildClaimCollateral({ loanIds: loan_ids }),
    BUILD_META,
  )

  tool(
    "build_set_auto_redeploy",
    "Prepare auto re-lend setting",
    "Returns the unsigned transaction to turn automatic re-lending of repaid principal on or off.",
    { enabled: z.boolean() },
    BUILD,
    ({ enabled }) => bl.buildSetAutoRedeploy({ enabled }),
    BUILD_META,
  )

  tool(
    "simulate_transaction",
    "Simulate a transaction",
    "Dry-runs one prepared transaction from a wallet against the latest block and explains the failure in plain language if it would revert. Steps that depend on an earlier approval only pass after that approval is mined.",
    {
      to: address,
      data: z.string().regex(/^0x[0-9a-fA-F]*$/),
      value: z.string().regex(/^\d+$/).optional(),
      from: address,
    },
    READ,
    ({ to, data, value, from }) =>
      bl.simulate({ chainId: bl.ctx.chainId, to: getAddress(to), data: data as Hex, value: value ?? "0", description: "" }, getAddress(from)),
  )

  return server
}
