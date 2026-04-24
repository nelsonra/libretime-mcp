import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { PlaylistContentSchema } from './types.js'

export function register(server: McpServer) {
  server.tool(
    'get_playlist_contents',
    'List the contents of a playlist.',
    {
      playlist_id: z.number().describe('Playlist ID'),
    },
    async ({ playlist_id }) => {
      const raw = await libreGet('/api/v2/playlist-contents', { playlist: String(playlist_id) })
      const contents = PlaylistContentSchema.array().parse(raw)
      return toolText(contents)
    }
  )
}
