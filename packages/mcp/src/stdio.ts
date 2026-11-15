#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import type { Hex } from "viem"
import { createServer } from "./server.js"

// Env: BASE_RPC_URL (optional, defaults to the public Base RPC), BASEDLOANS_DATA_SUFFIX (optional
// builder-code hex), BASEDLOANS_READ_ONLY=1 to hide transaction builders.
const server = createServer({
  rpcUrl: process.env.BASE_RPC_URL || undefined,
  dataSuffix: (process.env.BASEDLOANS_DATA_SUFFIX as Hex | undefined) || undefined,
  ...(process.env.BASEDLOANS_BUILDER_CODE !== undefined
    ? { builderCode: process.env.BASEDLOANS_BUILDER_CODE || null }
    : {}),
  readOnly: process.env.BASEDLOANS_READ_ONLY === "1",
})
await server.connect(new StdioServerTransport())
