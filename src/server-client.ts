import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { register as registerShows } from './tools/shows.js'

const server = new McpServer({
  name: 'libretime-mcp-client',
  version: '0.1.0',
})

registerShows(server)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('LibreTime MCP client server running (read-only: shows)')
