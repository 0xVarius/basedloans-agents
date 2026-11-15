import { createPublicClient, http, type Address, type Hex, type PublicClient } from "viem"
import { base } from "viem/chains"
import { coreAbi } from "./abis/core.js"
import { ledgerAbi } from "./abis/ledger.js"
import { KNOWN_ASSETS, RETIRED_ASSETS } from "./assets.generated.js"
import { Attribution } from "ox/erc8021"
import { BASE_CHAIN_ID, BASE_CORE, BASEDLOANS_BUILDER_CODE } from "./constants.js"
import type { ContractAddresses, KnownAsset } from "./types.js"

export interface BasedLoansOptions {
  /** An existing viem public client on Base. Takes precedence over rpcUrl. */
  publicClient?: PublicClient
  /** Base RPC URL. Defaults to the public https://mainnet.base.org endpoint (rate-limited). */
  rpcUrl?: string
  /** Core contract. Defaults to Base mainnet. Every other address is read from Core. */
  core?: Address
  /**
   * Base Builder Code (e.g. "bc_a1b2c3d4"). Encoded as an ERC-8021 suffix and appended to every
   * transaction's calldata for attribution. Defaults to the Based Loans code; pass null to disable.
   */
  builderCode?: string | null
  /** Raw hex suffix to append instead of a builder code. Overrides builderCode. */
  dataSuffix?: Hex
  /** Extra or overriding token metadata. On-chain data always wins for status and risk. */
  assets?: KnownAsset[]
}

export interface Context {
  client: PublicClient
  chainId: number
  core: Address
  dataSuffix?: Hex
  assets: Map<string, KnownAsset>
  contracts(): Promise<ContractAddresses>
}

export function createContext(opts: BasedLoansOptions = {}): Context {
  const client =
    opts.publicClient ??
    (createPublicClient({
      chain: base,
      transport: http(opts.rpcUrl ?? "https://mainnet.base.org", { retryCount: 3, retryDelay: 500 }),
      batch: { multicall: true },
    }) as PublicClient)

  if (opts.dataSuffix && !/^0x([0-9a-fA-F]{2})*$/.test(opts.dataSuffix)) {
    throw new Error("dataSuffix must be an even-length hex string starting with 0x")
  }
  const code = opts.builderCode === undefined ? BASEDLOANS_BUILDER_CODE : opts.builderCode
  if (code != null && !/^[a-z0-9_]{1,32}$/i.test(code)) throw new Error(`Invalid builder code "${code}"`)
  const dataSuffix: Hex | undefined = opts.dataSuffix ?? (code ? Attribution.toDataSuffix({ codes: [code] }) : undefined)

  const assets = new Map<string, KnownAsset>()
  for (const a of [...KNOWN_ASSETS, ...RETIRED_ASSETS, ...(opts.assets ?? [])]) assets.set(a.address.toLowerCase(), a)

  const core = opts.core ?? BASE_CORE
  let cached: Promise<ContractAddresses> | null = null

  return {
    client,
    chainId: client.chain?.id ?? BASE_CHAIN_ID,
    core,
    dataSuffix,
    assets,
    contracts() {
      if (!cached) {
        cached = (async () => {
          const [ledger, assetManager, oracleManager, feeDistributor, usdc] = await Promise.all([
            client.readContract({ address: core, abi: coreAbi, functionName: "ledger" }),
            client.readContract({ address: core, abi: coreAbi, functionName: "assetManager" }),
            client.readContract({ address: core, abi: coreAbi, functionName: "oracleManager" }),
            client.readContract({ address: core, abi: coreAbi, functionName: "feeDistributor" }),
            client.readContract({ address: core, abi: coreAbi, functionName: "USDC" }),
          ])
          const vault = await client.readContract({ address: ledger, abi: ledgerAbi, functionName: "vault" })
          return { core, ledger, assetManager, oracleManager, feeDistributor, usdc, vault }
        })().catch((e) => {
          cached = null
          throw e
        })
      }
      return cached
    },
  }
}
