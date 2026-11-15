# @basedloans/sdk

TypeScript SDK for [Based Loans](https://based.loans) on Base. Reads live protocol data and builds unsigned transactions for borrowing and lending. Never holds keys.

```bash
npm install @basedloans/sdk viem
```

```ts
import { createBasedLoans } from "@basedloans/sdk"

const bl = createBasedLoans({ rpcUrl: process.env.BASE_RPC_URL }) // defaults to the public Base RPC
```

## Read

| Method | Returns |
|---|---|
| `getProtocolParams()` | Loan fee, terms (duration and buyback cost), minimums, per-token limit bounds, paused state |
| `listMarkets({ onlyWithFunds })` | Every accepted collateral token with price, max loan-to-value, USDC available to borrow |
| `getMarket(asset)` | One token |
| `getRiskReport(asset)` | Price sources and whether they cross-check, pool history, cost to move the pool price 2× and 10×, flags with explanations |
| `quoteBorrow({ asset, collateralAmount, loanAmountUsdc?, term })` | Exact quote. Replays the lender queue, so the funded amount matches what the loan really gets |
| `getLoan(id)`, `getBorrowerLoans(addr)`, `getLenderPosition(addr)` | Positions |
| `requestTokenListing(token)` | Whether a token is accepted, and a pre-filled request link if not |

## Build (unsigned)

Each returns `{ steps, summary, warnings }`. Send `steps` in order; an approval comes first only when the current allowance is too low.

`buildBorrow`, `buildBuyback`, `buildDeposit` (optionally with per-token `limits`), `buildSetLimits`, `buildWithdraw`, `buildClaimProceeds`, `buildClaimCollateral`, `buildSetAutoRedeploy`.

`simulate(step, from)` dry-runs a step and explains a revert in plain words.

## Options

| Option | Meaning |
|---|---|
| `publicClient` | Your own viem client on Base |
| `rpcUrl` | Base RPC URL |
| `builderCode` | Base Builder Code appended to every transaction (ERC-8021). Defaults to the Based Loans code; `null` disables it |
| `dataSuffix` | Raw hex suffix instead of a builder code |
| `assets` | Extra token metadata (status and risk are always read on-chain) |

## Errors

Validation problems throw `BasedLoansError` with a `code` and a plain-language message. Contract reverts can be decoded with `explainError(err)` or `decodeBasedLoansError(data)`.
