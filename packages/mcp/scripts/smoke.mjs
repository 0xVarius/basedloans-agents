// Smoke test: drives the stdio server with a real MCP client, then the HTTP server.
// Usage: node scripts/smoke.mjs   (reads mainnet, read-only; set BASE_RPC_URL for a faster RPC)
import { spawn } from "node:child_process"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js"

let fails = 0
const check = (label, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  " + extra : ""}`)
  if (!ok) fails++
}
const text = (r) => r.content?.[0]?.text ?? ""

// ── stdio ──
const stdio = new Client({ name: "smoke", version: "0" })
await stdio.connect(new StdioClientTransport({ command: "node", args: ["dist/stdio.js"], env: { ...process.env } }))
const { tools } = await stdio.listTools()
check("stdio: tools listed", tools.length >= 19, `${tools.length} tools`)
check("stdio: every tool annotated", tools.every((t) => t.annotations?.title && t.annotations.readOnlyHint !== undefined))
check("stdio: instructions present", (stdio.getInstructions() ?? "").includes("no liquidations"))

const proto = JSON.parse(text(await stdio.callTool({ name: "get_protocol_info", arguments: {} })))
check("get_protocol_info", proto.terms?.length === 3, `fee ${proto.loanFeeBps}bps`)
const q = await stdio.callTool({ name: "quote_borrow", arguments: { asset: "WETH", collateral_amount: "0.1", term: "short" } })
const quote = JSON.parse(text(q))
check("quote_borrow by symbol", !q.isError && Number(quote.youReceiveUsdc) >= 0, `receive ${quote.youReceiveUsdc} warnings ${quote.warnings?.length}`)
const risk = JSON.parse(text(await stdio.callTool({ name: "get_risk_report", arguments: { asset: "HYDX" } })))
check("get_risk_report HYDX", Array.isArray(risk.flags) && risk.explanations, `${risk.level}: ${risk.flags.join(",")}`)
const bad = await stdio.callTool({ name: "get_market", arguments: { asset: "NOTATOKEN" } })
check("unknown symbol gives a clean error", bad.isError && text(bad).includes("request_token_listing"), text(bad).slice(0, 70))
const req = JSON.parse(text(await stdio.callTool({ name: "request_token_listing", arguments: { token: "0x000000000000000000000000000000000000dEaD" } })))
check("request_token_listing", req.status === "not_listed" && req.url.includes("tab=request"))
const plan = JSON.parse(
  text(await stdio.callTool({ name: "build_deposit", arguments: { amount_usdc: proto.minDepositUsdc, lender: "0x000000000000000000000000000000000000dEaD", limits: [{ asset: "WETH", limit_usdc: proto.minDepositUsdc }] } })),
)
check("build_deposit returns steps", plan.steps?.length === 2 && plan.steps[1].data.startsWith("0x"), plan.summary)
await stdio.close()

// ── read-only mode hides builders ──
const ro = new Client({ name: "smoke-ro", version: "0" })
await ro.connect(new StdioClientTransport({ command: "node", args: ["dist/stdio.js"], env: { ...process.env, BASEDLOANS_READ_ONLY: "1" } }))
const roTools = (await ro.listTools()).tools.map((t) => t.name)
check("read-only mode hides builders", !roTools.some((n) => n.startsWith("build_")), `${roTools.length} tools`)
await ro.close()

// ── HTTP ──
const port = 8799
const srv = spawn("node", ["dist/http.js"], { env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "ignore", "pipe"] })
await new Promise((r) => srv.stderr.once("data", r))
const base = `http://127.0.0.1:${port}`
const health = await fetch(`${base}/health`).then((r) => r.json())
check("http: /health", health.ok === true)
const httpQuote = await fetch(`${base}/v1/quote?asset=WETH&collateral=0.1&term=short`).then((r) => r.json())
check("http: /v1/quote", httpQuote.youReceiveUsdc !== undefined, `receive ${httpQuote.youReceiveUsdc}`)
const calls = await fetch(`${base}/v1/tx/deposit?amount_usdc=${proto.minDepositUsdc}&lender=0x000000000000000000000000000000000000dEaD&limits=WETH:${proto.minDepositUsdc}`).then((r) => r.json())
check("http: /v1/tx/deposit send_calls shape", calls.calls?.length === 2 && calls.calls[0].value === "0x0" && calls.chainId === 8453)
const err = await fetch(`${base}/v1/quote?asset=WETH`)
check("http: missing param is 400 with message", err.status === 400 && (await err.json()).error.includes("collateral"))
const mcpHttp = new Client({ name: "smoke-http", version: "0" })
await mcpHttp.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`)))
const httpTools = (await mcpHttp.listTools()).tools
check("http: MCP over /mcp", httpTools.length === tools.length, `${httpTools.length} tools`)
const httpProto = await mcpHttp.callTool({ name: "get_protocol_info", arguments: {} })
check("http: MCP tool call", !httpProto.isError && text(httpProto).includes("loanFeeBps"))
await mcpHttp.close()
srv.kill()

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED")
process.exit(fails ? 1 : 0)
