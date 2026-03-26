import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { librePatch } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { LibreFileSchema } from './types.js'

export function register(server: McpServer) {
  server.registerTool(
    'update_file_metadata',
    {
      description: 'Update metadata for a file already in the LibreTime library (track title, artist, album, genre).',
      inputSchema: {
        file_id: z.number().describe('ID of the file to update'),
        track_title: z.string().optional().describe('Track title'),
        artist_name: z.string().optional().describe('Artist name'),
        album_title: z.string().optional().describe('Album title'),
        genre: z.string().optional().describe('Genre'),
      },
    },
    async ({ file_id, track_title, artist_name, album_title, genre }) => {
      const body: Record<string, unknown> = {}
      if (track_title !== undefined) body.track_title = track_title
      if (artist_name !== undefined) body.artist_name = artist_name
      if (album_title !== undefined) body.album_title = album_title
      if (genre !== undefined) body.genre = genre

      const raw = await librePatch(`/api/v2/files/${file_id}`, body)
      const result = LibreFileSchema.parse(raw)
      return toolText(result)
    }
  )
}
