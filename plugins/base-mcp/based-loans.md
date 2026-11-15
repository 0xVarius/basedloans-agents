# Based Loans (custom plugin for Base MCP)

Borrow USDC against Base tokens with no liquidations, or lend USDC against tokens you choose. This plugin tells the agent how to call the Based Loans HTTP API and turn its response into a `send_calls` request for the user's Base Account.

API root: `https://mcp.based.loans/v1` (GET only, no auth, JSON). `GET /v1` lists every endpoint.

## Read first

- `GET /v1/market?asset=<address or symbol>` to check a token is accepted and how much USDC is available.
- `GET /v1/quote?asset=<token>&collateral=<amount>&term=short|medium|long` for what the user receives, the buyback cost and the due date. Show these to the user before preparing anything.
- `GET /v1/risk?asset=<token>` before lending against a token. Explain the `summary` and `flags` to the user.

## Prepare transactions

Every `/v1/tx/*` endpoint returns:

```json
{ "chainId": 8453, "summary": "...", "warnings": ["..."], "calls": [{ "to": "0x…", "data": "0x…", "value": "0x0", "description": "..." }] }
```

Pass `calls` in order to `send_calls` on chain 8453. Show `summary` and `warnings` to the user first. When an approval is needed it is the first call.

| Action | Endpoint |
|---|---|
| Borrow | `/v1/tx/borrow?asset=&collateral=&term=&borrower=<user address>` (optional `loan_usdc`) |
| Buy back | `/v1/tx/buyback?loan_id=&borrower=` (optional `payment_usdc`; omit to repay in full) |
| Deposit to lend | `/v1/tx/deposit?amount_usdc=&lender=&limits=<token>:<usdc>,<token>:<usdc>` |
| Change token limits | `/v1/tx/limits?lender=&limits=<token>:<usdc>,...` |
| Withdraw | `/v1/tx/withdraw?amount_usdc=<amount or max>&lender=` |
| Claim repaid USDC | `/v1/tx/claim-proceeds?loan_ids=1,2` |
| Claim defaulted collateral | `/v1/tx/claim-collateral?loan_ids=1,2` |

## Positions

- `GET /v1/loans?borrower=<address>`
- `GET /v1/lender?address=<address>`

## Rules

- Never prepare a borrow or deposit the user has not confirmed after seeing the quote or risk report.
- If a token is not accepted, call `GET /v1/request-token?token=<address>` and give the user the returned `url`. The user submits the request; nothing is sent automatically.
- After the due date a loan can no longer be bought back.
