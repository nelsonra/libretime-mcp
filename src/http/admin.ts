#!/usr/bin/env node
// HTTP MCP server — full admin access (shows + analytics + file/user management).
// Exposes POST /mcp using MCP Streamable HTTP transport.
// Requires Authorization: Bearer <MCP_API_KEY> on every MCP request.
// Intended for network clients (e.g. powerfm-agent). For Claude Desktop use stdio/admin.ts.
import '../env.js'
import crypto from 'node:crypto'
import { createRequire } from 'module'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import cors from 'cors'

const { version } = createRequire(import.meta.url)('../../package.json')

import { register as registerShows } from '../tools/shows/index.js'
import { register as registerAnalytics } from '../tools/analytics/index.js'
import { register as registerAdmin } from '../tools/admin/index.js'
import { register as registerFiles } from '../tools/files/index.js'
import { registerUploadEndpoint } from './upload.js'

const PORT = parseInt(process.env.MCP_PORT ?? '3000', 10)
const API_KEY = process.env.MCP_API_KEY
const PUBLIC_URL = process.env.MCP_PUBLIC_URL ?? `http://localhost:${PORT}`

const AUTH_DISABLED = process.env.DISABLE_AUTH === 'true'

if (!AUTH_DISABLED && !API_KEY) {
  console.error('ERROR: MCP_API_KEY environment variable is required')
  process.exit(1)
}

// Scoped upload token — generated once at startup, rotates on restart.
const UPLOAD_TOKEN = crypto.randomBytes(32).toString('hex')

const app = createMcpExpressApp({ host: '0.0.0.0' })
app.use(cors({ origin: process.env.CORS_ORIGIN ?? true, credentials: true }))

const UPLOAD_URL = registerUploadEndpoint(app, PUBLIC_URL, UPLOAD_TOKEN)

// Health check — no auth required, used by uptime monitors and load balancers
app.get('/ping', (_req, res) => {
  res.json({ status: 'ok' })
})

// Simple API key middleware — checks Authorization: Bearer <key>
app.use('/mcp', (req, res, next) => {
  if (AUTH_DISABLED) return next()
  const auth = req.headers['authorization']
  if (!auth || auth !== `Bearer ${API_KEY}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
})

// Stateless transport — a fresh McpServer per request keeps things simple
// and avoids session management complexity for now.
app.all('/mcp', async (req, res) => {
  const server = new McpServer({ name: 'libretime-mcp-admin', version })
  registerShows(server)
  registerAnalytics(server)
  registerAdmin(server)
  registerFiles(server, UPLOAD_URL, UPLOAD_TOKEN)

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

app.listen(PORT, '0.0.0.0', () => {
  console.error(`LibreTime MCP admin HTTP server listening on port ${PORT}`)
  console.error('Endpoint: POST /mcp  (Authorization: Bearer <MCP_API_KEY>)')
  console.error(`Upload:   POST /upload  (X-Upload-Token: <per-startup token>)`)
})
