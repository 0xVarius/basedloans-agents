# Based Loans for agents

Tools that let AI agents and apps use [Based Loans](https://based.loans), the no-liquidation lending protocol on Base.

- **Borrow:** deposit a token, get USDC now, buy the token back at a fixed price before the due date. Price swings never trigger a sale.
- **Lend:** deposit USDC and choose which tokens to lend against, with a limit per token.

Nothing here holds keys. Everything returns live data or unsigned transactions for the user's own wallet.

| Package | What it is |
|---|---|
| [`@basedloans/sdk`](packages/sdk) | TypeScript SDK (viem). Markets, risk reports, exact loan quotes, positions, unsigned transaction builders. |
| [`@basedloans/mcp`](packages/mcp) | MCP server (stdio and Streamable HTTP) plus a GET API for agents that cannot speak MCP. |
| [`@basedloans/agentkit`](packages/agentkit) | Coinbase AgentKit action provider. |
| [`skills/based-loans`](skills/based-loans/SKILL.md) | Agent skill (SKILL.md) with borrowing and lending workflows. |
| [`plugins/base-mcp`](plugins/base-mcp/based-loans.md) | Custom plugin spec for Base MCP. |
| [`integrations/bankr`](integrations/bankr/basedloans/SKILL.md) | Bankr skill (`SKILL.md` + `catalog.json`) for the BankrBot/skills catalog. |
| [`docs`](docs) | Collateral types guide and `llms.txt`. |

## Quick start

```bash
# MCP server for Claude Desktop, Cursor, etc.
npx -y @basedloans/mcp
```

```ts
import { createBasedLoans } from "@basedloans/sdk"

const bl = createBasedLoans({ rpcUrl: process.env.BASE_RPC_URL })
const quote = await bl.quoteBorrow({ asset: "0x4200000000000000000000000000000000000006", collateralAmount: "0.5", term: "short" })
const plan = await bl.buildBorrow({ asset: quote.asset, collateralAmount: "0.5", term: "short", borrower: "0xYou" })
// plan.steps: sign and send in order with your wallet
```

## Development

```bash
nvm use            # Node 24
npm install
npm run build
npm run typecheck
node packages/sdk/scripts/e2e-fork.mjs http://127.0.0.1:8545   # against an Anvil fork of Base
node packages/mcp/scripts/smoke.mjs                             # stdio + HTTP server checks
npm run sync:assets                                             # refresh the token list from the frontend
```

All protocol parameters (fees, terms, minimums, limits) are read on-chain. Contract addresses are resolved from Core at runtime.
