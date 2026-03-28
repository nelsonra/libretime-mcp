#!/usr/bin/env node
import { createRequire } from 'module'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { register as registerShows } from '../tools/shows/index.js'

const { version } = createRequire(import.meta.url)('../../package.json')

const server = new McpServer({
  name: 'libretime-mcp-client',
  version,
})

registerShows(server)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('LibreTime MCP client server running (read-only: shows)')
