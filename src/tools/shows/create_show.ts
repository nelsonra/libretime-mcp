import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { librePost } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { ShowSchema } from './types.js'

export function register(server: McpServer) {
  server.tool(
    'create_show',
    'Create a new show in LibreTime. Returns the created show with its ID, which can be used to schedule instances.',
    {
      name: z.string().describe('Show name'),
      description: z.string().optional().describe('Show description'),
      genre: z.string().optional().describe('Genre'),
      url: z.string().optional().describe('Show website URL'),
    },
    async ({ name, description, genre, url }) => {
      const raw = await librePost('/api/v2/shows', {
        name,
        description: description ?? null,
        genre: genre ?? null,
        url: url ?? null,
        linked: false,
        linkable: false,
        auto_playlist_enabled: false,
        auto_playlist_repeat: false,
        override_intro_playlist: false,
        override_outro_playlist: false,
      })
      const show = ShowSchema.parse(raw)
      return toolText(show)
    }
  )
}
