import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { LibreFileSchema } from './types.js'

export function register(server: McpServer) {
  server.registerTool(
    'search_files',
    {
      description:
        'Search the LibreTime media library. Optionally filter by genre. Returns file id, name, track title, artist, album, length, and mime type.',
      inputSchema: {
        genre: z.string().optional().describe('Filter files by genre'),
      },
    },
    async ({ genre }) => {
      const params: Record<string, string> = {}
      if (genre) params.genre = genre

      const raw = await libreGet('/api/v2/files', params)
      const files = z.array(LibreFileSchema).parse(raw)
      const trimmed = files.map(({ id, name, track_title, artist_name, album_title, genre, length, mime, import_status, created_at, last_played_at }) => ({
        id, name, track_title, artist_name, album_title, genre, length, mime, import_status, created_at, last_played_at,
      }))
      return toolText(trimmed)
    }
  )
}
