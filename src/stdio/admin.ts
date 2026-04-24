#!/usr/bin/env node
import { createRequire } from 'module'
import crypto from 'node:crypto'
import express from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { register as registerShows } from '../tools/shows/index.js'
import { register as registerAnalytics } from '../tools/analytics/index.js'
import { register as registerAdmin } from '../tools/admin/index.js'
import { register as registerFiles } from '../tools/files/index.js'
import { register as registerPlaylists } from '../tools/playlists/index.js'
import { register as registerPrompts } from '../prompts/index.js'
import { registerUploadEndpoint } from '../http/upload.js'

const { version } = createRequire(import.meta.url)('../../package.json')

// Spin up a local HTTP server solely for the file upload endpoint.
// The MCP protocol runs over stdio — this is a side-channel so the
// iframe UI can POST files without going through the MCP protocol.
const UPLOAD_PORT = parseInt(process.env.UPLOAD_PORT ?? '4000', 10)
const PUBLIC_URL = `http://localhost:${UPLOAD_PORT}`
const UPLOAD_TOKEN = crypto.randomBytes(32).toString('hex')

const app = express()
const uploadUrl = registerUploadEndpoint(app, PUBLIC_URL, UPLOAD_TOKEN)
app.listen(UPLOAD_PORT, () => {
  console.error(`Upload:   POST /upload on port ${UPLOAD_PORT}`)
})

const server = new McpServer({
  name: 'libretime-mcp-admin',
  version,
})

registerShows(server)
registerAnalytics(server)
registerAdmin(server)
registerFiles(server, uploadUrl, UPLOAD_TOKEN)
registerPlaylists(server)
registerPrompts(server)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('LibreTime MCP admin server running (shows + analytics + admin)')
