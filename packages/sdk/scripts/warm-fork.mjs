// Warms a cold Anvil fork by reading every market once (prices, available USDC, active loans), so a
// frontend pointed at the fork doesn't time out on its first batched reads.
// Usage: node scripts/warm-fork.mjs http://127.0.0.1:8545
import { createPublicClient, http } from "viem"
import { base } from "viem/chains"
import { createBasedLoans } from "../dist/index.js"

const RPC = process.argv[2] ?? "http://127.0.0.1:8545"
const pub = createPublicClient({
  chain: { ...base, rpcUrls: { default: { http: [RPC] } } },
  transport: http(RPC, { timeout: 300_000 }),
  batch: { multicall: true },
})
const t = Date.now()
const markets = await createBasedLoans({ publicClient: pub }).listMarkets()
const weth = markets.find((x) => x.symbol === "WETH")
console.log(
  "warmed " + markets.length + " markets in " + Math.round((Date.now() - t) / 1000) + "s; WETH $" + weth?.priceUsd?.toFixed(2) + " available " + weth?.availableToBorrowUsdc,
)
