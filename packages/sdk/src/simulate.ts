import type { Address } from "viem"
import type { Context } from "./context.js"
import { explainError } from "./errors.js"
import type { UnsignedTransaction } from "./types.js"

export interface SimulationResult {
  ok: boolean
  error?: { name: string; message: string }
}

/**
 * Dry-runs one transaction from `from` against the latest block. Steps that depend on an earlier
 * step (e.g. an approval) will fail here until that step is mined, so simulate approvals first.
 */
export async function simulateTransaction(ctx: Context, transaction: UnsignedTransaction, from: Address): Promise<SimulationResult> {
  try {
    await ctx.client.call({ account: from, to: transaction.to, data: transaction.data, value: BigInt(transaction.value) })
    return { ok: true }
  } catch (e) {
    const d = explainError(e)
    return { ok: false, error: { name: d.name, message: d.message } }
  }
}
