import { formatUnits, parseUnits } from "viem"

/** An amount given either as a decimal string in token units ("12.5") or a raw bigint. */
export type AmountInput = string | number | bigint

/** Converts a human amount to raw units. Bigints are treated as already raw. */
export function toRaw(amount: AmountInput, decimals: number): bigint {
  if (typeof amount === "bigint") return amount
  const s = typeof amount === "number" ? numberToPlainString(amount) : amount.trim()
  if (!/^\d+(\.\d+)?$/.test(s)) throw new Error(`Invalid amount "${amount}". Use a plain decimal like "12.5".`)
  return parseUnits(s, decimals)
}

export function fromRaw(raw: bigint, decimals: number): string {
  return formatUnits(raw, decimals)
}

function numberToPlainString(n: number): string {
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid amount ${n}`)
  // Avoid exponent notation for very small or large numbers.
  return n.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 18 })
}

export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2).replace(/\.?0+$/, "")}%`
}

export function isoDate(unixSeconds: number | bigint): string {
  return new Date(Number(unixSeconds) * 1000).toISOString()
}
