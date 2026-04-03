import { createRequire } from 'module'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import type { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

const { version } = createRequire(import.meta.url)('../../package.json')

interface ServerOptions {
  /** MCP server name reported to clients */
  name: string
  /** Default port if MCP_PORT env var is not set */
  defaultPort: number
  /** Register tools onto the MCP server — called once per request (stateless transport) */
  register: (server: McpServer) => void
  /**
   * Optional routes mounted after /ping but before the auth middleware.
   * Use this to add endpoints with their own auth (e.g. /upload).
   */
  setupRoutes?: (app: Express) => void
}

export function createHttpServer({ name, defaultPort, register, setupRoutes }: ServerOptions) {
  const PORT = parseInt(process.env.MCP_PORT ?? String(defaultPort), 10)
  const API_KEY = process.env.MCP_API_KEY
  const AUTH_DISABLED = process.env.DISABLE_AUTH === 'true'

  if (!AUTH_DISABLED && !API_KEY) {
    console.error('ERROR: MCP_API_KEY environment variable is required')
    process.exit(1)
  }

  const app = createMcpExpressApp({ host: '0.0.0.0' })

  // Security headers — sets ~14 protective HTTP headers automatically.
  // contentSecurityPolicy disabled: the MCP SDK sets its own and they'd conflict.
  app.use(helmet({ contentSecurityPolicy: false }))
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? true, credentials: true }))

  // Rate limiting — max 120 requests per IP per minute.
  // Protects against runaway clients and accidental hammering.
  // /ping is excluded so uptime monitors never get blocked.
  app.use(/^\/(mcp|upload)/, rateLimit({ windowMs: 60_000, max: 120 }))

  // Rate limiting — max 120 requests per IP per minute.
  // Protects against runaway clients and accidental hammering.
  // /ping is excluded so uptime monitors never get blocked.
  app.use(/^\/(mcp|upload)/, rateLimit({ windowMs: 60_000, max: 120 }))

  // Health check — no auth required, used by uptime monitors and load balancers
  app.get('/ping', (_req, res) => {
    res.json({ status: 'ok' })
  })

  // Extra routes (e.g. /upload) with their own auth — must come before the MCP auth guard
  setupRoutes?.(app)

  // API key guard — protects all /mcp requests
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
    const server = new McpServer({ name, version })
    register(server)

    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
  })

  app.listen(PORT, '0.0.0.0', () => {
    console.error(`LibreTime MCP ${name} HTTP server listening on port ${PORT}`)
    console.error(`Health:   GET  /ping`)
    console.error(`Endpoint: POST /mcp  (Authorization: Bearer <MCP_API_KEY>)`)
  })
}
