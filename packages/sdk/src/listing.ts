import { getAddress, isAddress, type Address } from "viem"
import { assetManagerAbi } from "./abis/assetManager.js"
import { TOKEN_REQUEST_URL } from "./constants.js"
import type { Context } from "./context.js"
import { BasedLoansError } from "./errors.js"
import { readTokenMeta } from "./markets.js"

export interface TokenListingRequest {
  token: Address
  symbol: string | null
  status: "already_active" | "listed_but_paused" | "not_listed"
  /** Page where a person can submit the request. Pre-filled with the token address. */
  url: string
  message: string
}

/**
 * Checks whether a token is accepted as collateral and, if not, returns a pre-filled link to the
 * Based Loans request form. It never submits anything itself: a person sends the request.
 */
export async function requestTokenListing(ctx: Context, tokenIn: string): Promise<TokenListingRequest> {
  if (!isAddress(tokenIn)) throw new BasedLoansError("Give the token's contract address on Base (0x…).", "INVALID_ADDRESS")
  const token = getAddress(tokenIn)
  const c = await ctx.contracts()
  const [configured, active, meta] = await Promise.all([
    ctx.client.readContract({ address: c.assetManager, abi: assetManagerAbi, functionName: "isConfigured", args: [token] }),
    ctx.client.readContract({ address: c.assetManager, abi: assetManagerAbi, functionName: "isActive", args: [token] }),
    readTokenMeta(ctx, token).catch(() => null),
  ])
  const symbol = meta?.symbol ?? null
  const safeSymbol = symbol && /^[\w.$-]{1,32}$/.test(symbol) ? symbol : null
  const url = `${TOKEN_REQUEST_URL}?tab=request&token=${token}${safeSymbol ? `&symbol=${encodeURIComponent(safeSymbol)}` : ""}`
  const name = symbol ? `${symbol} (${token})` : token
  if (configured && active) {
    return { token, symbol, status: "already_active", url, message: `${name} is already accepted as collateral. No request needed.` }
  }
  if (configured) {
    return {
      token,
      symbol,
      status: "listed_but_paused",
      url,
      message: `${name} is set up but new loans against it are switched off right now. You can still ask the team to turn it back on.`,
    }
  }
  return {
    token,
    symbol,
    status: "not_listed",
    url,
    message: `${name} is not accepted yet. Open the link to request it; the Based Loans team reviews every request.`,
  }
}
