#!/usr/bin/env node
// HTTP MCP server — read-only access (shows, schedule, stream state only).
// Exposes POST /mcp using MCP Streamable HTTP transport.
// Requires Authorization: Bearer <MCP_API_KEY> on every request.
// Intended for network clients. For Claude Desktop use stdio/client.ts.
import '../env.js'

import { register as registerShows } from '../tools/shows/index.js'
import { createHttpServer } from './server.js'

createHttpServer({
  name: 'libretime-mcp-client',
  defaultPort: 3001,
  register: (server) => {
    registerShows(server)
  },
})
