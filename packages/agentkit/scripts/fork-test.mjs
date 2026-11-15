// Loads the provider inside a real AgentKit instance with a viem wallet on an Anvil fork and
// invokes actions through AgentKit's own action list. Fork only; uses an Anvil test key.
// Usage: node scripts/fork-test.mjs http://127.0.0.1:8552
import { AgentKit, ViemWalletProvider } from "@coinbase/agentkit"
import { createPublicClient, createWalletClient, encodeAbiParameters, http, keccak256, parseAbi, parseEther, toHex } from "viem"
import { mnemonicToAccount } from "viem/accounts"
// Anvil's public default test mnemonic. Fork-only accounts, never funded on a real chain.
const ANVIL_MNEMONIC = "test test test test test test test test test test test junk"
import { base } from "viem/chains"
import { basedLoansActionProvider } from "../dist/index.js"

// AgentKit 0.10.x fires an un-awaited telemetry request on every action invoke and throws when the
// endpoint errors, which crashes Node with an unhandled rejection. Ignore only that error.
let telemetryErrors = 0
process.on("unhandledRejection", (e) => {
  if (String(e?.message ?? e).startsWith("HTTP error! status:")) return void telemetryErrors++
  throw e
})

const RPC = process.argv[2] ?? "http://127.0.0.1:8552"
const chain = { ...base, rpcUrls: { default: { http: [RPC] } } }
const acct = mnemonicToAccount(ANVIL_MNEMONIC, { addressIndex: 2 })
const transport = http(RPC, { timeout: 180_000 })
const pub = createPublicClient({ chain, transport })
const walletClient = createWalletClient({ chain, transport, account: acct })

let fails = 0
const check = (l, ok, x = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${l}${x ? "  " + x : ""}`); if (!ok) fails++ }

await pub.request({ method: "anvil_setBalance", params: [acct.address, toHex(parseEther("10"))] })
await walletClient.writeContract({ address: "0x4200000000000000000000000000000000000006", abi: parseAbi(["function deposit() payable"]), functionName: "deposit", value: parseEther("2") })
// 2,000 USDC so the wallet can also lend (USDC balances live in slot 9).
const slot = keccak256(encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [acct.address, 9n]))
await pub.request({ method: "anvil_setStorageAt", params: ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", slot, toHex(2_000_000_000n, { size: 32 })] })

const walletProvider = new ViemWalletProvider(walletClient)
const agentKit = await AgentKit.from({ walletProvider, actionProviders: [basedLoansActionProvider({ publicClient: pub })] })
const actions = agentKit.getActions()
const ours = actions.filter((a) => a.name.startsWith("BasedLoansActionProvider_") || a.name.toLowerCase().includes("basedloans"))
check("AgentKit loads the provider", ours.length === 14, `${ours.length} actions: ${ours.map((a) => a.name.split("_").slice(1).join("_")).join(", ")}`)
const act = (n) => ours.find((a) => a.name.split("_").slice(1).join("_") === n)

const info = await act("get_protocol_info").invoke({})
check("read action via AgentKit", info.includes("loanFeeBps"))
const lend = await act("lend").invoke({ amountUsdc: "1000", limits: [{ token: "WETH", limitUsdc: "1000" }] })
check("lend action (wallet injected, approve + deposit)", lend.includes("Transactions: 0x"), lend.split("\n")[0])
const quote = JSON.parse(await act("quote_borrow").invoke({ token: "WETH", collateralAmount: "0.1", term: "short" }))
check("quote via AgentKit", Number(quote.youReceiveUsdc) > 0, `receive ${quote.youReceiveUsdc}`)
const borrow = await act("borrow").invoke({ token: "WETH", collateralAmount: "0.1", term: "short" })
check("borrow action signed by the agent wallet", borrow.includes("Transactions: 0x"), borrow.slice(0, 600))
const loans = JSON.parse(await act("get_my_loans").invoke({}))
check("get_my_loans sees the new loan", loans.some((l) => l.status === "active"), `${loans.length} loan(s)`)
const repay = await act("buyback").invoke({ loanId: loans.at(-1).loanId })
check("buyback action", repay.includes("Transactions: 0x"), repay.split("\n")[0])
const tiny = await act("borrow").invoke({ token: "WETH", collateralAmount: "0.01", term: "short" })
check("doomed loan refused before sending", tiny.startsWith("Error: Not building this loan"), tiny)
const bad = await act("borrow").invoke({ token: "NOTATOKEN", collateralAmount: "1", term: "short" })
check("bad input returns a readable error, not a throw", bad.startsWith("Error:"), bad)

if (telemetryErrors) console.log(`(ignored ${telemetryErrors} failed AgentKit telemetry request(s))`)
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED")
process.exit(fails ? 1 : 0)
