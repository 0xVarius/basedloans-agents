// Web-standard request handler (Request -> Response). Serves MCP over Streamable HTTP at /mcp and a
// keyless GET API at /v1 for agents that cannot speak MCP (e.g. Base MCP custom plugins, which turn
// /v1/tx responses into send_calls). Used as-is on Vercel and wrapped by http.ts for plain Node.
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { BasedLoansError, createBasedLoans, explainError, type TransactionPlan } from "@basedloans/sdk"
import { getAddress, isAddress, type Hex } from "viem"
import { createServer, type ServerOptions } from "./server.js"
import { COLLATERAL_TYPES_GUIDE } from "./text.js"

export function optionsFromEnv(env: Record<string, string | undefined> = process.env): ServerOptions {
  return {
    rpcUrl: env.BASE_RPC_URL || undefined,
    dataSuffix: (env.BASEDLOANS_DATA_SUFFIX as Hex | undefined) || undefined,
    ...(env.BASEDLOANS_BUILDER_CODE !== undefined ? { builderCode: env.BASEDLOANS_BUILDER_CODE || null } : {}),
    readOnly: env.BASEDLOANS_READ_ONLY === "1",
  }
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, mcp-session-id, mcp-protocol-version",
  "access-control-expose-headers": "mcp-session-id",
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS },
  })

export function createFetchHandler(opts: ServerOptions = optionsFromEnv()) {
  const bl = createBasedLoans(opts)

  // Per-instance limiter: protects the RPC budget on a single instance. On Vercel, add a firewall
  // rate-limit rule as well, since instances do not share this map.
  const RATE = Number(process.env.RATE_PER_MINUTE ?? 60)
  const hits = new Map<string, { n: number; t: number }>()
  const limited = (ip: string) => {
    const now = Date.now()
    const h = hits.get(ip)
    if (!h || now - h.t > 60_000) {
      hits.set(ip, { n: 1, t: now })
      if (hits.size > 10_000) hits.clear()
      return false
    }
    return ++h.n > RATE
  }

  const asCalls = (plan: TransactionPlan) => ({
    chainId: bl.ctx.chainId,
    summary: plan.summary,
    warnings: plan.warnings,
    // send_calls shape: run in order, approval first when present.
    calls: plan.steps.map((s) => ({ to: s.to, data: s.data, value: `0x${BigInt(s.value).toString(16)}`, description: s.description })),
  })
  const addr = (v: string | null, name: string) => {
    if (!v || !isAddress(v)) throw new BasedLoansError(`Query parameter ${name} must be a 0x address.`, "INVALID_INPUT")
    return getAddress(v)
  }
  const asset = (v: string | null) => {
    if (!v) throw new BasedLoansError("Query parameter asset is required.", "INVALID_INPUT")
    if (isAddress(v)) return getAddress(v)
    const m = [...bl.ctx.assets.values()].filter((a) => a.symbol.toLowerCase() === v.toLowerCase())
    if (m.length === 1) return getAddress(m[0]!.address)
    throw new BasedLoansError(`Unknown or ambiguous token "${v}". Pass its contract address.`, "UNKNOWN_TOKEN")
  }
  const need = (v: string | null, name: string) => {
    if (!v) throw new BasedLoansError(`Query parameter ${name} is required.`, "INVALID_INPUT")
    return v
  }

  async function api(url: URL): Promise<unknown> {
    const q = url.searchParams
    const p = url.pathname.replace(/\/+$/, "")
    switch (p) {
      case "/v1":
        return {
          name: "Based Loans API",
          website: "https://based.loans",
          docs: "https://docs.based.loans",
          developerDocs: "https://github.com/0xVarius/basedloans-agents",
          mcp: "/mcp",
          endpoints: [
            "GET /v1/protocol",
            "GET /v1/markets?only_with_funds=true",
            "GET /v1/market?asset=",
            "GET /v1/risk?asset=",
            "GET /v1/quote?asset=&collateral=&term=&loan_usdc=",
            "GET /v1/loans?borrower=",
            "GET /v1/lender?address=",
            "GET /v1/request-token?token=",
            "GET /v1/collateral-types",
            ...(opts.readOnly
              ? []
              : [
                  "GET /v1/tx/borrow?asset=&collateral=&term=&borrower=&loan_usdc=",
                  "GET /v1/tx/buyback?loan_id=&borrower=&payment_usdc=",
                  "GET /v1/tx/deposit?amount_usdc=&lender=&limits=ASSET:USDC,ASSET:USDC",
                  "GET /v1/tx/limits?lender=&limits=ASSET:USDC,...",
                  "GET /v1/tx/withdraw?amount_usdc=|max&lender=&as_musdc=true",
                  "GET /v1/tx/claim-proceeds?loan_ids=1,2&mode=withdraw|redeploy",
                  "GET /v1/tx/claim-collateral?loan_ids=1,2",
                ]),
          ],
        }
      case "/v1/protocol":
        return bl.getProtocolParams()
      case "/v1/markets":
        return bl.listMarkets({ onlyWithFunds: q.get("only_with_funds") === "true" })
      case "/v1/market":
        return (await bl.getMarket(asset(q.get("asset")))) ?? { notListed: true }
      case "/v1/risk":
        return (await bl.getRiskReport(asset(q.get("asset")), { skipDepth: q.get("skip_depth") === "true" })) ?? { notListed: true }
      case "/v1/quote":
        return bl.quoteBorrow({
          asset: asset(q.get("asset")),
          collateralAmount: need(q.get("collateral"), "collateral"),
          loanAmountUsdc: q.get("loan_usdc") ?? undefined,
          term: need(q.get("term"), "term"),
        })
      case "/v1/loans":
        return bl.getBorrowerLoans(addr(q.get("borrower"), "borrower"))
      case "/v1/lender":
        return bl.getLenderPosition(addr(q.get("address"), "address"))
      case "/v1/request-token":
        return bl.requestTokenListing(need(q.get("token"), "token"))
      case "/v1/collateral-types":
        return { guide: COLLATERAL_TYPES_GUIDE }
    }
    if (opts.readOnly) throw new BasedLoansError("Not found.", "NOT_FOUND")
    const limits = (s: string | null) =>
      (s ?? "")
        .split(",")
        .filter(Boolean)
        .map((pair) => {
          const [a, l] = pair.split(":")
          return { asset: asset(a ?? null), limitUsdc: need(l ?? null, "limit") }
        })
    const ids = (s: string | null) => need(s, "loan_ids").split(",").filter(Boolean)
    switch (p) {
      case "/v1/tx/borrow":
        return asCalls(
          await bl.buildBorrow({
            asset: asset(q.get("asset")),
            collateralAmount: need(q.get("collateral"), "collateral"),
            loanAmountUsdc: q.get("loan_usdc") ?? undefined,
            term: need(q.get("term"), "term"),
            borrower: addr(q.get("borrower"), "borrower"),
          }),
        )
      case "/v1/tx/buyback":
        return asCalls(
          await bl.buildBuyback({ loanId: need(q.get("loan_id"), "loan_id"), paymentUsdc: q.get("payment_usdc") ?? undefined, borrower: addr(q.get("borrower"), "borrower") }),
        )
      case "/v1/tx/deposit": {
        const l = limits(q.get("limits"))
        return asCalls(await bl.buildDeposit({ amountUsdc: need(q.get("amount_usdc"), "amount_usdc"), lender: addr(q.get("lender"), "lender"), limits: l.length ? l : undefined }))
      }
      case "/v1/tx/limits":
        return asCalls(await bl.buildSetLimits({ limits: limits(q.get("limits")), lender: addr(q.get("lender"), "lender") }))
      case "/v1/tx/withdraw": {
        const amt = need(q.get("amount_usdc"), "amount_usdc")
        return asCalls(await bl.buildWithdraw({ amountUsdc: amt === "max" ? "max" : amt, lender: addr(q.get("lender"), "lender"), asMusdc: q.get("as_musdc") === "true" }))
      }
      case "/v1/tx/claim-proceeds":
        return asCalls(await bl.buildClaimProceeds({ loanIds: ids(q.get("loan_ids")), mode: q.get("mode") === "redeploy" ? "redeploy" : "withdraw" }))
      case "/v1/tx/claim-collateral":
        return asCalls(await bl.buildClaimCollateral({ loanIds: ids(q.get("loan_ids")) }))
    }
    throw new BasedLoansError("Not found. GET /v1 lists the endpoints.", "NOT_FOUND")
  }

  return async function handle(request: Request, clientIp = "?"): Promise<Response> {
    const url = new URL(request.url)
    try {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS })
      if (url.pathname === "/health") return json(200, { ok: true })
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || clientIp
      if (limited(ip)) return json(429, { error: "Too many requests. Slow down and retry in a minute." })

      // A browser (or curl) opening the MCP URL directly: explain instead of returning a protocol error.
      // MCP clients always POST, or GET with Accept: text/event-stream, so they never land here.
      if (url.pathname === "/mcp" && request.method === "GET" && !(request.headers.get("accept") ?? "").includes("text/event-stream")) {
        return json(200, {
          name: "Based Loans MCP server",
          about: "This URL is for AI apps that speak the Model Context Protocol (MCP), not for browsers.",
          connect: {
            claudeCode: `claude mcp add --transport http basedloans ${url.origin}/mcp`,
            claudeDesktopOrCursor: { mcpServers: { basedloans: { url: `${url.origin}/mcp` } } },
            local: "npx -y @basedloans/mcp",
          },
          httpApi: `${url.origin}/v1`,
          docs: "https://docs.based.loans",
          developerDocs: "https://github.com/0xVarius/basedloans-agents",
        })
      }

      if (url.pathname === "/mcp") {
        if (Number(request.headers.get("content-length") ?? 0) > 1_000_000) return json(413, { error: "Request too large." })
        // Stateless: a fresh server and transport per request, no sessions to track.
        const server = createServer(opts)
        const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
        await server.connect(transport)
        const res = await transport.handleRequest(request)
        const headers = new Headers(res.headers)
        for (const [k, v] of Object.entries(CORS)) headers.set(k, v)
        return new Response(res.body, { status: res.status, headers })
      }

      if (request.method === "GET" && url.pathname.startsWith("/v1")) return json(200, await api(url))
      if (url.pathname === "/" || url.pathname === "") {
        return json(200, {
          name: "Based Loans agent server",
          description: "Borrow USDC against Base tokens with no liquidations, or lend USDC. Live quotes, token risk data and unsigned transactions. Holds no keys.",
          mcp: `${url.origin}/mcp`,
          api: `${url.origin}/v1`,
          website: "https://based.loans",
          docs: "https://docs.based.loans",
          developerDocs: "https://github.com/0xVarius/basedloans-agents",
          npm: "https://www.npmjs.com/package/@basedloans/mcp",
        })
      }
      return json(404, { error: "Not found. MCP is at /mcp, the HTTP API at /v1." })
    } catch (e) {
      const status = e instanceof BasedLoansError ? (e.code === "NOT_FOUND" ? 404 : e.code === "RPC_ERROR" ? 503 : 400) : 400
      const message = e instanceof BasedLoansError ? e.message : explainError(e).message
      return json(status, { error: message, code: e instanceof BasedLoansError ? e.code : "ERROR" })
    }
  }
}
