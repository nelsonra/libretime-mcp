// HTTP MCP server — full admin access (shows + analytics + file/user management).
// Exposes POST /mcp using MCP Streamable HTTP transport.
// Requires Authorization: Bearer <MCP_API_KEY> on every request.
// Intended for network clients (e.g. powerfm-agent). For Claude Desktop use server-admin.ts (stdio).
import './env.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'

import { register as registerShows } from './tools/shows.js'
import { register as registerAnalytics } from './tools/analytics.js'
import { register as registerAdmin } from './tools/admin.js'

const PORT = parseInt(process.env.MCP_PORT ?? '3000', 10)
const API_KEY = process.env.MCP_API_KEY

if (!API_KEY) {
  console.error('ERROR: MCP_API_KEY environment variable is required')
  process.exit(1)
}

const app = createMcpExpressApp({ host: '0.0.0.0' })

// Simple API key middleware — checks Authorization: Bearer <key>
app.use('/mcp', (req, res, next) => {
  const auth = req.headers['authorization']
  if (!auth || auth !== `Bearer ${API_KEY}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
})

// Stateless transport — a fresh McpServer per request keeps things simple
// and avoids session management complexity for now
app.post('/mcp', async (req, res) => {
  const server = new McpServer({ name: 'libretime-mcp-admin', version: '0.1.0' })
  registerShows(server)
  registerAnalytics(server)
  registerAdmin(server)

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

app.listen(PORT, '0.0.0.0', () => {
  console.error(`LibreTime MCP admin HTTP server listening on port ${PORT}`)
  console.error('Endpoint: POST /mcp  (Authorization: Bearer <MCP_API_KEY>)')
})
