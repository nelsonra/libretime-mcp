import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { librePost } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { PlaylistContentSchema } from './types.js'

export function register(server: McpServer) {
  server.tool(
    'add_to_playlist',
    'Add a file or stream to a playlist. Use get_playlist_contents to check the current contents and determine the next position.',
    {
      playlist_id: z.number().describe('Playlist ID to add to'),
      file_id: z.number().optional().describe('File ID to add (use for audio files)'),
      stream_id: z.number().optional().describe('Stream ID to add (use for webstreams)'),
      position: z.number().optional().describe('Position in the playlist (0-based). Appends to end if omitted.'),
    },
    async ({ playlist_id, file_id, stream_id, position }) => {
      if (file_id === undefined && stream_id === undefined) {
        return toolText({ status: 'error', reason: 'Either file_id or stream_id must be provided.' })
      }

      const kind = stream_id !== undefined ? 1 : 0

      const raw = await librePost('/api/v2/playlist-contents', {
        playlist: playlist_id,
        file: file_id ?? null,
        stream: stream_id ?? null,
        kind,
        position: position ?? null,
        offset: 0,
        cue_in: '0:00:00.000000',
        cue_out: null,
        fade_in: null,
        fade_out: null,
      })

      const content = PlaylistContentSchema.parse(raw)
      return toolText({ status: 'added', content })
    }
  )
}
