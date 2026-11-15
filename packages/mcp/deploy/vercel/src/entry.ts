// Vercel entry, bundled into api/index.js by `npm run build:vercel` (packages/mcp).
// Every path is rewritten here by vercel.json. Holds no keys and never sends transactions.
import { createFetchHandler } from "../../../src/fetch.js"

const handle = createFetchHandler()

export const GET = (request: Request) => handle(request)
export const POST = (request: Request) => handle(request)
export const DELETE = (request: Request) => handle(request)
export const OPTIONS = (request: Request) => handle(request)
