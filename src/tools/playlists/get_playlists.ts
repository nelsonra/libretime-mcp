import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { PlaylistSchema } from './types.js'

export function register(server: McpServer) {
  server.tool(
    'get_playlists',
    'List all playlists in the LibreTime media library.',
    {},
    async () => {
      const raw = await libreGet('/api/v2/playlists')
      const playlists = PlaylistSchema.array().parse(raw)
      return toolText(playlists)
    }
  )
}
