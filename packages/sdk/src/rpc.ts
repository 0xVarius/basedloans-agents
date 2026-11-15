import { BaseError, ContractFunctionRevertedError } from "viem"
import { BasedLoansError } from "./errors.js"

/** True when a call failed because the contract reverted, as opposed to an RPC or network problem. */
export function isRevert(err: unknown): boolean {
  if (err instanceof BaseError) {
    if (err.walk((e) => e instanceof ContractFunctionRevertedError)) return true
    return /reverted|execution reverted/i.test(err.shortMessage ?? err.message)
  }
  return false
}

type Settled = { status: "success"; result: unknown } | { status: "failure"; error: Error }

/**
 * Throws when any multicall entry failed for a non-revert reason. A revert is a real answer from
 * the chain; a timeout or rate limit is not, and must never be reported as "zero" or "none".
 */
export function assertNoTransportFailures(results: readonly Settled[], what: string): void {
  const bad = results.find((r) => r.status === "failure" && !isRevert(r.error))
  if (bad && bad.status === "failure") {
    throw new BasedLoansError(
      `Could not read ${what} (RPC error: ${(bad.error.message ?? "").split("\n")[0]?.slice(0, 80)}). Retry, or use a faster RPC.`,
      "RPC_ERROR",
    )
  }
}
