#!/usr/bin/env node
// Plain Node server for self-hosting. All logic lives in fetch.ts (the same handler Vercel runs);
// this file only converts Node's request/response objects to and from web-standard ones.
import { createServer as createHttpServer } from "node:http"
import { Readable } from "node:stream"
import { createFetchHandler, optionsFromEnv } from "./fetch.js"

const PORT = Number(process.env.PORT ?? 8787)
const opts = optionsFromEnv()
const handle = createFetchHandler(opts)

const httpServer = createHttpServer(async (req, res) => {
  try {
    const url = `http://${req.headers.host ?? "localhost"}${req.url ?? "/"}`
    const headers = new Headers()
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, x))
      else if (v != null) headers.set(k, v)
    }
    const hasBody = req.method !== "GET" && req.method !== "HEAD"
    const request = new Request(url, {
      method: req.method,
      headers,
      body: hasBody ? (Readable.toWeb(req) as unknown as ReadableStream) : undefined,
      // Required by Node's fetch implementation when streaming a request body.
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit)
    const response = await handle(request, req.socket.remoteAddress ?? "?")
    res.writeHead(response.status, Object.fromEntries(response.headers))
    if (response.body) {
      for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) res.write(chunk)
    }
    res.end()
  } catch (e) {
    if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" })
    res.end(JSON.stringify({ error: (e as Error).message }))
  }
})

httpServer.listen(PORT, () => {
  console.error(`Based Loans server on :${PORT} (MCP /mcp, API /v1${opts.readOnly ? ", read-only" : ""})`)
})
