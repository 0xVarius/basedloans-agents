// Live read-only smoke test: node --experimental-strip-types scripts/smoke-risk.ts [asset...]
import { createContext } from "../dist/index.js"
import { getRiskReport } from "../dist/index.js"

const ctx = createContext()
const assets = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["0x00000e7efa313F4E11Bfff432471eD9423AC6B30", "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", "0xE187FCa3fF7Ba74B91A6376920E5B974631E4ffe"]

for (const a of assets) {
  const t0 = Date.now()
  const r = await getRiskReport(ctx, a as `0x${string}`)
  if (!r) {
    console.log(a, "not configured")
    continue
  }
  console.log(`\n== ${r.symbol} (${r.level}) ${Date.now() - t0}ms`)
  console.log(r.summary)
  console.log("flags:", r.flags.join(", "))
  console.log(`sources live ${r.liveSources}/${r.sources.length} minSources ${r.minSources} crossCheck ${r.crossCheckActive}`)
  for (const p of r.pools) {
    console.log(
      `pool ${p.pool} ${p.kind} ${p.method} quote=${p.quoteSymbol} fee=${p.feeBps}bps history=${p.maxReadableHistorySeconds}s 2x=$${p.costToDoublePriceUsd?.toFixed(0)} 10x=$${p.costToTenXPriceUsd?.toFixed(0)}${p.note ? " | " + p.note : ""}`,
    )
  }
}
