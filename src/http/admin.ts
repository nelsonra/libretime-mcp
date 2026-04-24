#!/usr/bin/env node
// HTTP MCP server — full admin access (shows + analytics + file/user management).
// Exposes POST /mcp using MCP Streamable HTTP transport.
// Requires Authorization: Bearer <MCP_API_KEY> on every MCP request.
// Intended for network clients (e.g. powerfm-agent). For Claude Desktop use stdio/admin.ts.
import '../env.js'
import crypto from 'node:crypto'

import { register as registerShows } from '../tools/shows/index.js'
import { register as registerAnalytics } from '../tools/analytics/index.js'
import { register as registerAdmin } from '../tools/admin/index.js'
import { register as registerFiles } from '../tools/files/index.js'
import { register as registerPlaylists } from '../tools/playlists/index.js'
import { register as registerPrompts } from '../prompts/index.js'
import { registerUploadEndpoint } from './upload.js'
import { createHttpServer } from './server.js'

const PORT = parseInt(process.env.MCP_PORT ?? '3000', 10)
const PUBLIC_URL = process.env.MCP_PUBLIC_URL ?? `http://localhost:${PORT}`

// Scoped upload token — generated once at startup, rotates on restart.
const UPLOAD_TOKEN = crypto.randomBytes(32).toString('hex')

// uploadUrl is set by setupRoutes (which runs at startup) and read by register
// (which runs per-request). setupRoutes always runs first, so this is safe.
let uploadUrl: string

createHttpServer({
  name: 'libretime-mcp-admin',
  defaultPort: 3000,
  setupRoutes: (app) => {
    uploadUrl = registerUploadEndpoint(app, PUBLIC_URL, UPLOAD_TOKEN)
    console.error(`Upload:   POST /upload  (X-Upload-Token: <per-startup token>)`)
  },
  register: (server) => {
    registerShows(server)
    registerAnalytics(server)
    registerAdmin(server)
    registerFiles(server, uploadUrl, UPLOAD_TOKEN)
    registerPlaylists(server)
    registerPrompts(server)
  },
})
