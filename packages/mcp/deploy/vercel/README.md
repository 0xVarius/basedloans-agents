# Deploying mcp.based.loans on Vercel

The function in `api/index.ts` runs the same fetch handler as `node dist/http.js`, so the local smoke test (`node scripts/smoke.mjs`) covers it. Every path is rewritten to that one function: `/mcp` (MCP over Streamable HTTP, stateless), `/v1/*` (GET API), `/health`.

## One-time setup

1. Publish `@basedloans/sdk` and `@basedloans/mcp` to npm first, or change the dependency in `package.json` here to a `file:` path.
2. Create a Vercel project with this folder (`packages/mcp/deploy/vercel`) as its root directory.
3. Set the environment variables:
   - `BASE_RPC_URL`: the QuickNode Base RPC (shared with the website, so keep the firewall limit tight).
   - `BASEDLOANS_BUILDER_CODE`: optional. The SDK already defaults to the Based Loans code `bc_7x4gwndk`.
   - `RATE_PER_MINUTE`: optional per-instance limit (default 60).
4. Add the domain `mcp.based.loans` to the project, and add the CNAME record Vercel shows you at the DNS provider.
5. Add a Vercel Firewall rate-limit rule on `/mcp` and `/v1` (30 requests per minute per IP: the RPC is shared with based.loans). The in-code limiter is per instance only.

## Check after deploy

```bash
curl https://mcp.based.loans/health
curl "https://mcp.based.loans/v1/quote?asset=WETH&collateral=0.1&term=short"
```

Then add the remote URL to an MCP client, or publish `server.json` to the MCP Registry, which already lists `https://mcp.based.loans/mcp` under `remotes`.
