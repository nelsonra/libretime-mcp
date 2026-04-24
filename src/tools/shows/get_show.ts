import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { ShowSchema } from './types.js'

export function register(server: McpServer) {
  server.tool(
    'get_show',
    'Get details of a single LibreTime show by ID.',
    { id: z.number().describe('Show ID') },
    async ({ id }) => {
      const raw = await libreGet(`/api/v2/shows/${id}`)
      const show = ShowSchema.parse(raw)
      return toolText(show)
    }
  )
}
