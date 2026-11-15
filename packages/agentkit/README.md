# @basedloans/agentkit

[Coinbase AgentKit](https://github.com/coinbase/agentkit) action provider for [Based Loans](https://based.loans) on Base.

Agents can borrow USDC against tokens they hold, with no liquidations, and buy the tokens back before the due date. They can also lend USDC against tokens they choose, with a limit per token.

```bash
npm install @basedloans/agentkit @coinbase/agentkit
```

```ts
import { AgentKit } from "@coinbase/agentkit"
import { basedLoansActionProvider } from "@basedloans/agentkit"

const agentKit = await AgentKit.from({
  walletProvider,                       // any EvmWalletProvider on base-mainnet
  actionProviders: [basedLoansActionProvider({ rpcUrl: process.env.BASE_RPC_URL })],
})
```

## Actions

| Action | What it does |
|---|---|
| `get_protocol_info` | Loan fee, terms, minimums |
| `list_markets` | Accepted collateral tokens and USDC available against each |
| `get_risk_report` | Price sources, pool history, cost to move the price, flags with explanations |
| `quote_borrow` | Exact quote: USDC received, buyback cost, due date |
| `borrow` | Open a loan (approval sent first only if needed) |
| `buyback` | Repay part or all of a loan and get collateral back |
| `get_my_loans` | This wallet's loans |
| `lend` | Deposit USDC, optionally with per-token limits |
| `set_lending_limits` | Add, change or remove per-token limits |
| `withdraw` | Withdraw USDC that is not in active loans |
| `get_my_lending` | This wallet's lending position, claimable proceeds and collateral |
| `claim_proceeds`, `claim_collateral` | Collect repaid USDC or defaulted collateral |
| `request_token_listing` | Link for a person to request a new collateral token |

Write actions are signed by the agent's wallet. Reads go straight to Base through the SDK, using `rpcUrl` or the public Base RPC.

## Known AgentKit issue

AgentKit 0.10.x sends a telemetry request to Coinbase every time an action is invoked, including the wallet address. It doesn't await or catch that request. If the telemetry endpoint returns an error, Node exits with an unhandled rejection. This affects every AgentKit action provider, not just this one. Until AgentKit fixes it, add a handler in your app:

```ts
process.on("unhandledRejection", (e) => {
  if (String((e as Error)?.message ?? e).startsWith("HTTP error! status:")) return // AgentKit telemetry
  throw e
})
```
