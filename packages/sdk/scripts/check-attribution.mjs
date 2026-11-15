// Fork check: the website's write path (viem writeContract with dataSuffix) lands the Builder Code
// on-chain, the contract accepts it, and an SDK-built plan leaves approvals untagged.
// Usage: node scripts/check-attribution.mjs http://127.0.0.1:8553
import { createPublicClient, createWalletClient, http, parseAbi, parseEther, toHex } from "viem"
import { mnemonicToAccount } from "viem/accounts"
// Anvil's public default test mnemonic. Fork-only accounts, never funded on a real chain.
const ANVIL_MNEMONIC = "test test test test test test test test test test test junk"
import { base } from "viem/chains"
import { Attribution } from "ox/erc8021"
import { createBasedLoans } from "../dist/index.js"

const RPC = process.argv[2] ?? "http://127.0.0.1:8553"
const SUFFIX = "0x62635f37783467776e646b0b0080218021802180218021802180218021" // website constant
const chain = { ...base, rpcUrls: { default: { http: [RPC] } } }
const acct = mnemonicToAccount(ANVIL_MNEMONIC, { addressIndex: 3 })
const transport = http(RPC, { timeout: 120_000 })
const pub = createPublicClient({ chain, transport })
const wallet = createWalletClient({ chain, transport, account: acct })
let fails = 0
const check = (l, ok, x = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${l}${x ? "  " + x : ""}`); if (!ok) fails++ }

await pub.request({ method: "anvil_setBalance", params: [acct.address, toHex(parseEther("1"))] })
const LEDGER = "0x278CfeaDeAaCBe88f24692ef199247cF17c5141F"
const hash = await wallet.writeContract({
  address: LEDGER,
  abi: parseAbi(["function setAutoRedeploy(bool enabled)"]),
  functionName: "setAutoRedeploy",
  args: [false],
  dataSuffix: SUFFIX,
})
const receipt = await pub.waitForTransactionReceipt({ hash })
check("ledger accepts calldata with the suffix", receipt.status === "success")
const tx = await pub.getTransaction({ hash })
check("mined input carries bc_7x4gwndk", JSON.stringify(Attribution.fromData(tx.input)?.codes) === '["bc_7x4gwndk"]', tx.input.slice(-60))

const bl = createBasedLoans({ publicClient: pub })
const plan = await bl.buildDeposit({ amountUsdc: "500", lender: acct.address, limits: [{ asset: "0x4200000000000000000000000000000000000006", limitUsdc: "500" }] })
const [approve, deposit] = plan.steps
check("SDK leaves the token approval untagged", !approve.data.endsWith("80218021802180218021802180218021"))
check("SDK tags the ledger call", deposit.data.endsWith(SUFFIX.slice(2)))

console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED")
process.exit(fails ? 1 : 0)
