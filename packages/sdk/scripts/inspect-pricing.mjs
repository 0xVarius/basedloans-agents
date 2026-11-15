// Dev helper: print how selected collateral tokens are priced on Base mainnet (read-only).
// Usage: node scripts/inspect-pricing.mjs [SYMBOL ...]
import { createBasedLoans, decodeSource, readAssetConfig } from "../dist/index.js"

const bl = createBasedLoans({ rpcUrl: process.env.BASE_RPC_URL })
const symbols = process.argv.slice(2).length ? process.argv.slice(2) : ["esALB", "ALB", "xMONSTRO", "xl-LS", "cbETH", "MONSTRO", "PLAZM", "DUB"]

for (const sym of symbols) {
  const a = [...bl.ctx.assets.values()].find((x) => x.symbol === sym)
  if (!a) {
    console.log(sym, "not in list")
    continue
  }
  const m = await bl.getMarket(a.address)
  const cfg = await readAssetConfig(bl.ctx, a.address)
  const kinds = (cfg?.sources ?? []).map(decodeSource).map((s) => {
    let k = s.kind
    if (s.fixedRatio != null) k += "(fixed " + s.fixedRatio + ")"
    if (s.ratioContract) k += "(live " + s.ratioContract + ")"
    if (s.baseToken && s.kind === "derived_ratio") k += "(base " + s.baseToken + ")"
    if (s.hopPool) k += "(2hop via " + s.quoteToken + ")"
    if (s.quoteVault) k += "(vault quote)"
    return k
  })
  const status = m ? (m.active ? "active" : "INACTIVE") + " " + m.pricingType + " $" + m.priceUsd : "not configured"
  console.log(sym.padEnd(9), a.address, status, "|", kinds.join(" + "), "|", a.name)
}
