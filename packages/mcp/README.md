# @basedloans/mcp

MCP server for [Based Loans](https://based.loans) on Base: market data, token risk reports, exact loan quotes, positions, and unsigned borrow and lend transactions. Holds no keys.

## Use it

Claude Desktop, Cursor and other MCP clients:

```json
{
  "mcpServers": {
    "basedloans": {
      "command": "npx",
      "args": ["-y", "@basedloans/mcp"],
      "env": { "BASE_RPC_URL": "https://your-base-rpc" }
    }
  }
}
```

Hosted (Streamable HTTP): `https://mcp.based.loans/mcp`

## Tools

Read: `get_protocol_info`, `list_markets`, `get_market`, `get_risk_report`, `quote_borrow`, `get_loan`, `get_borrower_loans`, `get_lender_position`, `request_token_listing`, `explain_collateral_types`, `simulate_transaction`.

Prepare (return unsigned transactions): `build_borrow`, `build_buyback`, `build_deposit`, `build_set_limits`, `build_withdraw`, `build_claim_proceeds`, `build_claim_collateral`, `build_set_auto_redeploy`.

Every tool is annotated read-only: none of them change anything on-chain. The prepare tools return transactions for the user's wallet to sign.

## Environment

| Variable | Meaning |
|---|---|
| `BASE_RPC_URL` | Base RPC (defaults to the public endpoint, which is rate-limited) |
| `BASEDLOANS_READ_ONLY=1` | Hide the prepare tools |
| `BASEDLOANS_BUILDER_CODE` | Base Builder Code appended to every prepared transaction (ERC-8021). Empty string disables it |
| `BASEDLOANS_DATA_SUFFIX` | Raw hex suffix instead of a builder code |
| `PORT`, `RATE_PER_MINUTE` | HTTP mode only |

## HTTP mode

`node dist/http.js` serves MCP at `/mcp` and a GET API at `/v1` (see `GET /v1`). `/v1/tx/*` endpoints return calls in the `send_calls` shape. The same handler is exported as `@basedloans/mcp/fetch` for web-standard runtimes; see [`deploy/vercel`](deploy/vercel/README.md).
