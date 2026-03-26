import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { ShowSchema } from './types.js'

export function register(server: McpServer) {
  server.registerTool(
    'get_shows',
    {
      description: "List all shows registered in LibreTime. Returns each show's id, name, description, and genre.",
    },
    async () => {
      const raw = await libreGet('/api/v2/shows')
      const shows = z.array(ShowSchema).parse(raw)
      const trimmed = shows.map(({ id, name, description, genre, url }) => ({ id, name, description, genre, url }))
      return toolText(trimmed)
    }
  )
}
