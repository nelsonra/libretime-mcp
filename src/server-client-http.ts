// Load .env file if present (dev convenience — no-op in production where env vars are set externally)
try { process.loadEnvFile() } catch {}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { register as registerShows } from './tools/shows.js'

const PORT = parseInt(process.env.MCP_PORT ?? '3001', 10)
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

app.post('/mcp', async (req, res) => {
  const server = new McpServer({ name: 'libretime-mcp-client', version: '0.1.0' })
  registerShows(server)

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

app.listen(PORT, '0.0.0.0', () => {
  console.error(`LibreTime MCP client HTTP server listening on port ${PORT}`)
  console.error('Endpoint: POST /mcp  (Authorization: Bearer <MCP_API_KEY>)')
})
