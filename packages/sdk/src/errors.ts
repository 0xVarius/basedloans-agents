import { BaseError, ContractFunctionRevertedError, decodeErrorResult, type Abi, type Hex } from "viem"
import { assetManagerAbi } from "./abis/assetManager.js"
import { coreAbi } from "./abis/core.js"
import { ledgerAbi } from "./abis/ledger.js"
import { musdcAbi } from "./abis/musdc.js"
import { oracleManagerAbi } from "./abis/oracleManager.js"

const erc20Errors = [
  { type: "error", name: "ERC20InsufficientBalance", inputs: [{ name: "sender", type: "address" }, { name: "balance", type: "uint256" }, { name: "needed", type: "uint256" }] },
  { type: "error", name: "ERC20InsufficientAllowance", inputs: [{ name: "spender", type: "address" }, { name: "allowance", type: "uint256" }, { name: "needed", type: "uint256" }] },
  { type: "error", name: "SafeERC20FailedOperation", inputs: [{ name: "token", type: "address" }] },
  { type: "error", name: "Error", inputs: [{ name: "message", type: "string" }] },
] as const

const ALL_ERRORS = [
  ...coreAbi,
  ...ledgerAbi,
  ...assetManagerAbi,
  ...oracleManagerAbi,
  ...musdcAbi,
  ...erc20Errors,
].filter((x) => x.type === "error") as unknown as Abi

/** Plain-language messages by error name. Anything unmapped falls back to the decoded name. */
const MESSAGES: Record<string, string> = {
  Paused: "Based Loans is paused right now. New actions are blocked until it resumes.",
  ZeroAmount: "Amount cannot be zero.",
  InvalidTermIndex: "Invalid loan term. Use 0 (short), 1 (medium) or 2 (long).",
  AssetNotActive: "This token is not currently accepted as collateral.",
  InsufficientOracleSources: "Not enough working price sources for this token right now. Try again later.",
  ExcessivePriceDeviation: "This token's price sources disagree too much right now. Try again later.",
  LoanTooSmall: "The loan would be below the minimum size. Offer more collateral or check available funds.",
  ExposureCapExceeded: "This token has reached its limit for active loans. Try a smaller amount or later.",
  ShortfallTooLoose: "The shortfall tolerance is looser than the protocol allows.",
  ShortfallTooLarge: "Less money is available than requested, by more than your shortfall tolerance allows.",
  PythFeeTooLow: "Pyth price updates are no longer used. Pass an empty update list and no ETH.",
  EthRefundFailed: "Could not refund ETH sent with the transaction. Send no ETH.",
  LoanInactive: "This loan is no longer active.",
  NotBorrower: "Only the borrower who opened this loan can buy back its collateral.",
  LoanExpired: "This loan is past its due date, so the collateral can no longer be bought back.",
  BuybackExceedsRemaining: "Payment is more than what is left to pay on this loan.",
  BelowMinBuyback: "Payment is below the minimum buyback amount.",
  InvalidClaimBatch: "Claim between 1 and 50 loans per transaction.",
  BelowMinDeposit: "Deposit is below the minimum.",
  InsufficientUnlockedBalance: "Not enough available USDC. Some of it is in active loans.",
  VaultNotSet: "Withdrawing as mUSDC is not available right now.",
  InvalidInput: "Invalid input. Check the amounts and token lists.",
  BatchTooLarge: "Too many loans in one transaction. Use fewer.",
  NoProceeds: "Nothing to claim for these loans.",
  CapBelowMinimum: "Per-token limit is below the minimum allowed.",
  CapAboveMaximum: "Per-token limit is above the maximum allowed.",
  CapBelowUtilized: "Per-token limit cannot be lower than the amount already in active loans for that token.",
  TooManyConfiguredAssets: "You have reached the maximum number of tokens you can lend against.",
  Unauthorized: "This action is not allowed for this caller.",
  AssetNotConfigured: "This token is not set up on Based Loans. You can request it with requestTokenListing.",
  AssetInactive: "This token is not currently accepted as collateral.",
  WethPriceUnavailable: "The ETH price needed to value this token is unavailable right now. Try again later.",
  VaultMaxWithdrawExceeded: "The USDC vault cannot pay out that much right now. Try a smaller amount.",
  ReentrancyGuardReentrantCall: "Nested calls into Based Loans are not allowed.",
  ERC20InsufficientBalance: "Wallet balance is too low for this transaction.",
  ERC20InsufficientAllowance: "The token approval is too low. Send the approval step first.",
  SafeERC20FailedOperation: "A token transfer failed. Check the balance and approval.",
}

export interface DecodedError {
  name: string
  args: readonly unknown[]
  message: string
}

/** Decodes revert data from any Based Loans contract into a name and plain-language message. */
export function decodeBasedLoansError(data: Hex): DecodedError | null {
  try {
    const r = decodeErrorResult({ abi: ALL_ERRORS, data })
    const args = (r.args ?? []) as readonly unknown[]
    const name = r.errorName
    return { name, args, message: MESSAGES[name] ?? (name === "Error" ? String(args[0]) : `Transaction would fail: ${name}.`) }
  } catch {
    return null
  }
}

/** Extracts and decodes revert data from a viem error. */
export function explainError(err: unknown): DecodedError {
  if (err instanceof BaseError) {
    const reverted = err.walk((e) => e instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null
    const data = (reverted?.raw ?? findData(err)) as Hex | undefined
    if (data) {
      const d = decodeBasedLoansError(data)
      if (d) return d
    }
    return { name: "Unknown", args: [], message: err.shortMessage || err.message }
  }
  return { name: "Unknown", args: [], message: err instanceof Error ? err.message : String(err) }
}

function findData(err: BaseError): Hex | undefined {
  let found: Hex | undefined
  err.walk((e) => {
    const d = (e as { data?: unknown }).data
    if (typeof d === "string" && d.startsWith("0x") && d.length >= 10) {
      found = d as Hex
      return true
    }
    return false
  })
  return found
}

export class BasedLoansError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = "BasedLoansError"
  }
}
