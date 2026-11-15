import type { Address } from "viem"
import { ledgerAbi } from "./abis/ledger.js"
import type { Context } from "./context.js"

const ZERO = "0x0000000000000000000000000000000000000000"
const MAX_NODES = 300

export interface FillPreview {
  /** USDC the protocol would fund for `needed`, replaying LendingLedger.requestLiquidity. */
  funded: bigint
  lenders: { lender: Address; amount: bigint }[]
  /** Why matching stopped before `needed`, if it did. */
  stopReason: "filled" | "out_of_funds" | "lender_limit" | "below_min_fill" | "queue_too_long"
  minAssetCap: bigint
}

/**
 * Read-only replay of requestLiquidity(asset, needed, 0, 0). The contract walks the lender queue
 * in order, skips lenders with less than minAssetCap available, and stops early when the amount
 * still needed drops below minAssetCap (to avoid dust positions). getMatchableLiquidity does not
 * model that early stop, which is why a quote built on it can overstate the fill.
 */
export async function previewFill(ctx: Context, asset: Address, neededIn: bigint): Promise<FillPreview> {
  const c = await ctx.contracts()
  const L = { address: c.ledger, abi: ledgerAbi } as const
  const [head, limitRaw, minAssetCap, stats] = await Promise.all([
    ctx.client.readContract({ ...L, functionName: "getQueue", args: [asset] }).then((q) => q[0]),
    ctx.client.readContract({ ...L, functionName: "maxLendersPerFill" }),
    ctx.client.readContract({ ...L, functionName: "minAssetCap" }),
    ctx.client.readContract({ ...L, functionName: "getProtocolStats" }),
  ])
  // getProtocolStats().idle is already capped at what the vault can deliver.
  const deliverable = stats[2]
  const needed = neededIn > deliverable ? deliverable : neededIn
  const limit = Number(limitRaw)

  const lenders: FillPreview["lenders"] = []
  let funded = 0n
  let current: Address = head
  let nodes = 0
  let stopReason: FillPreview["stopReason"] = "out_of_funds"

  while (current !== ZERO && funded < needed && lenders.length < limit) {
    if (++nodes > MAX_NODES) {
      stopReason = "queue_too_long"
      break
    }
    const [next, account, cap] = await Promise.all([
      ctx.client.readContract({ ...L, functionName: "nextInLine", args: [asset, current] }),
      ctx.client.readContract({ ...L, functionName: "getAccount", args: [current] }),
      ctx.client.readContract({ ...L, functionName: "getAssetCap", args: [current, asset] }),
    ])
    const idle = account[2]
    const capRemaining = cap[2]
    const canLend = idle < capRemaining ? idle : capRemaining
    if (canLend >= minAssetCap) {
      const still = needed - funded
      const take = canLend < still ? canLend : still
      if (take < minAssetCap) {
        stopReason = "below_min_fill"
        break
      }
      lenders.push({ lender: current, amount: take })
      funded += take
    }
    current = next
  }
  if (funded >= needed) stopReason = "filled"
  else if (stopReason === "out_of_funds" && lenders.length >= limit) stopReason = "lender_limit"
  if (neededIn > deliverable && stopReason === "filled") stopReason = "out_of_funds"
  return { funded, lenders, stopReason, minAssetCap }
}
