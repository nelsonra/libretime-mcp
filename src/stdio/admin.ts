#!/usr/bin/env node
import { createRequire } from 'module'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { register as registerShows } from '../tools/shows/index.js'
import { register as registerAnalytics } from '../tools/analytics/index.js'
import { register as registerAdmin } from '../tools/admin/index.js'
import { register as registerFiles } from '../tools/files/index.js'

const { version } = createRequire(import.meta.url)('../../package.json')

const server = new McpServer({
  name: 'libretime-mcp-admin',
  version,
})

registerShows(server)
registerAnalytics(server)
registerAdmin(server)
registerFiles(server)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('LibreTime MCP admin server running (shows + analytics + admin)')
