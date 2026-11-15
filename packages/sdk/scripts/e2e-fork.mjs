// End-to-end on an Anvil fork of Base mainnet. Signs every step the SDK returns with an
// Anvil test key; never touches mainnet. Usage: node scripts/e2e-fork.mjs http://127.0.0.1:8551
import {
  createPublicClient, createWalletClient, encodeAbiParameters, http, keccak256, parseAbi, parseEther, toHex,
} from "viem"
import { mnemonicToAccount } from "viem/accounts"
// Anvil's public default test mnemonic. Fork-only accounts, never funded on a real chain.
const ANVIL_MNEMONIC = "test test test test test test test test test test test junk"
import { base } from "viem/chains"
import { createBasedLoans } from "../dist/index.js"

const RPC = process.argv[2] ?? "http://127.0.0.1:8551"
const chain = { ...base, rpcUrls: { default: { http: [RPC] } } }
// Anvil default account #1 (public test key, fork only).
const acct = mnemonicToAccount(ANVIL_MNEMONIC, { addressIndex: 1 })
const pub = createPublicClient({ chain, transport: http(RPC, { timeout: 180_000 }) })
const wallet = createWalletClient({ chain, transport: http(RPC, { timeout: 180_000 }), account: acct })
const bl = createBasedLoans({ publicClient: pub })

const WETH = "0x4200000000000000000000000000000000000006"
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
const erc20 = parseAbi(["function balanceOf(address) view returns (uint256)", "function deposit() payable"])
let failures = 0
const check = (label, ok, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  " + extra : ""}`); if (!ok) failures++ }

async function run(plan, label) {
  for (const s of plan.steps) {
    const sim = await bl.simulate(s, acct.address)
    if (!sim.ok && !s.description.startsWith("Approve")) { check(`${label}: simulate "${s.description.slice(0, 50)}"`, false, sim.error?.message); return false }
    const hash = await wallet.sendTransaction({ to: s.to, data: s.data, value: BigInt(s.value) })
    const r = await pub.waitForTransactionReceipt({ hash })
    if (r.status !== "success") { check(`${label}: step reverted`, false, s.description); return false }
  }
  check(`${label}: ${plan.steps.length} step(s) mined`, true)
  return true
}

async function setUsdc(addr, amount) {
  const slot = keccak256(encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [addr, 9n]))
  await pub.request({ method: "anvil_setStorageAt", params: [USDC, slot, toHex(amount, { size: 32 })] })
}

// ── Fund the test wallet ──
await pub.request({ method: "anvil_setBalance", params: [acct.address, toHex(parseEther("20"))] })
await wallet.writeContract({ address: WETH, abi: erc20, functionName: "deposit", value: parseEther("5") })
await setUsdc(acct.address, 5_000_000_000n) // 5,000 USDC

// ── Read-only surface ──
const params = await bl.getProtocolParams()
check("protocol params", params.terms.length === 3 && params.loanFeeBps > 0, `fee ${params.loanFeeBps}bps, terms ${params.terms.map((t) => t.durationDays + "d").join("/")}`)
const markets = await bl.listMarkets()
check("listMarkets", markets.length > 50, `${markets.length} active`)
const weth = await bl.getMarket(WETH)
check("getMarket WETH", weth?.priceUsd > 0, `$${weth?.priceUsd?.toFixed(2)} available ${weth?.availableToBorrowUsdc}`)
const listed = await bl.requestTokenListing(WETH)
check("requestTokenListing (listed)", listed.status === "already_active")
const unlisted = await bl.requestTokenListing("0x000000000000000000000000000000000000dEaD")
check("requestTokenListing (not listed)", unlisted.status === "not_listed" && unlisted.url.includes("tab=request"), unlisted.url)

// ── Lender flow: deposit with a WETH limit so there is money to borrow ──
const dep = await bl.buildDeposit({ amountUsdc: "1000", lender: acct.address, limits: [{ asset: WETH, limitUsdc: "1000" }] })
check("buildDeposit includes approval", dep.steps.length === 2)
await run(dep, "deposit 1000 USDC + WETH limit")
let pos = await bl.getLenderPosition(acct.address)
check("lender position after deposit", Number(pos.depositedUsdc) > 990 && pos.assets.some((a) => a.asset.toLowerCase() === WETH.toLowerCase()), `deposited ${pos.depositedUsdc}`)

// ── Borrow flow ──
const before = await pub.readContract({ address: USDC, abi: erc20, functionName: "balanceOf", args: [acct.address] })
const q = await bl.quoteBorrow({ asset: WETH, collateralAmount: "0.1", term: "short" })
check("quoteBorrow", Number(q.youReceiveUsdc) > 0, `receive ${q.youReceiveUsdc} buyback ${q.buybackCostUsdc} warnings ${q.warnings.length}`)
const borrow = await bl.buildBorrow({ asset: WETH, collateralAmount: "0.1", term: "short", borrower: acct.address })
await run(borrow, "borrow against 0.1 WETH")
const after = await pub.readContract({ address: USDC, abi: erc20, functionName: "balanceOf", args: [acct.address] })
const got = Number(after - before) / 1e6
check("USDC received matches quote", Math.abs(got - Number(q.youReceiveUsdc)) < 0.01, `got ${got} quoted ${q.youReceiveUsdc}`)
const loans = await bl.getBorrowerLoans(acct.address)
const loan = loans.at(-1)
check("getBorrowerLoans", loan?.status === "active", `loan ${loan?.loanId} buyback ${loan?.buybackRemainingUsdc}`)

// ── Partial then full buyback ──
try {
  await bl.buildBuyback({ loanId: loan.loanId, paymentUsdc: "0.5", borrower: acct.address })
  check("sub-minimum buyback refused", false)
} catch (e) {
  check("sub-minimum buyback refused", e.code === "INVALID_PAYMENT", e.message)
}
await run(await bl.buildBuyback({ loanId: loan.loanId, paymentUsdc: "10", borrower: acct.address }), "partial buyback 10 USDC")
const mid = await bl.getLoan(loan.loanId)
check("partial buyback status", mid.status === "partially_repaid", `remaining ${mid.buybackRemainingUsdc}`)
await run(await bl.buildBuyback({ loanId: loan.loanId, borrower: acct.address }), "full buyback")
const done = await bl.getLoan(loan.loanId)
check("loan repaid", done.status === "repaid" && Number(done.collateralRemaining) === 0)

// ── Lender wrap-up ──
pos = await bl.getLenderPosition(acct.address)
const mineLoan = pos.loans.find((l) => l.loanId === loan.loanId)
const funders = (await bl.getLoan(loan.loanId)).lenders.map((l) => l.lender.toLowerCase())
check("lender view matches loan funders", funders.includes(acct.address.toLowerCase()) === !!mineLoan, `test lender funded: ${!!mineLoan}`)
await run(await bl.buildSetLimits({ limits: [{ asset: WETH, limitUsdc: "500" }], lender: acct.address }), "lower WETH limit to 500")
await run(await bl.buildWithdraw({ amountUsdc: "100", lender: acct.address }), "withdraw 100 USDC")
const musdcPlan = await bl.buildWithdraw({ amountUsdc: "max", lender: acct.address, asMusdc: true })
await run(musdcPlan, "withdraw max as mUSDC")
pos = await bl.getLenderPosition(acct.address)
check("mUSDC max leaves no meaningful dust", Number(pos.availableToWithdrawUsdc) < 0.01, `${musdcPlan.summary} left ${pos.availableToWithdrawUsdc}`)

// ── Loan 0 exists and is readable (IDs start at 0) ──
const zero = await bl.getLoan(0)
check("loan 0 readable", zero !== null && zero.loanId === "0", zero ? `${zero.symbol} ${zero.status}` : "null")

// ── Error path ──
try {
  await bl.buildBuyback({ loanId: loan.loanId, borrower: acct.address })
  check("buyback on repaid loan rejected", false)
} catch (e) {
  check("buyback on repaid loan rejected", e.code === "LOAN_INACTIVE", e.message)
}

console.log(failures === 0 ? "\nALL PASSED" : `\n${failures} FAILED`)
process.exit(failures === 0 ? 0 : 1)
