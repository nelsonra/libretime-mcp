import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { librePost } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { PlaylistSchema } from './types.js'

export function register(server: McpServer) {
  server.tool(
    'create_playlist',
    'Create a new playlist in LibreTime. Returns the playlist ID for use with add_to_playlist.',
    {
      name: z.string().describe('Playlist name'),
      description: z.string().optional().describe('Playlist description'),
    },
    async ({ name, description }) => {
      const raw = await librePost('/api/v2/playlists', {
        name,
        description: description ?? null,
      })
      const playlist = PlaylistSchema.parse(raw)
      return toolText(playlist)
    }
  )
}
