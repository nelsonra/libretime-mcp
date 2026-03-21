import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { register as registerShows } from './tools/shows.js'
import { register as registerAnalytics } from './tools/analytics.js'
import { register as registerAdmin } from './tools/admin.js'

const server = new McpServer({
  name: 'libretime-mcp-admin',
  version: '0.1.0',
})

registerShows(server)
registerAnalytics(server)
registerAdmin(server)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('LibreTime MCP admin server running (shows + analytics + admin)')
