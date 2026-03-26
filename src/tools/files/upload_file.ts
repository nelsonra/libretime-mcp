import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreUpload } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { LibreFileSchema } from './types.js'

export function register(server: McpServer) {
  server.registerTool(
    'upload_file',
    {
      description:
        'Upload an audio file to the LibreTime media library from a URL. If no URL is provided, returns an action signal so the client can trigger a local file upload workflow. Optionally provide metadata such as track title, artist, album, and genre.',
      inputSchema: {
        url: z.string().optional().describe('Publicly accessible URL of the audio file to upload'),
        track_title: z.string().optional().describe('Track title'),
        artist_name: z.string().optional().describe('Artist name'),
        album_title: z.string().optional().describe('Album title'),
        genre: z.string().optional().describe('Genre'),
      },
    },
    async ({ url, track_title, artist_name, album_title, genre }) => {
      if (!url) {
        return toolText({ status: 'upload_required', action: 'file_upload' })
      }

      let fileResponse: Response
      try {
        fileResponse = await fetch(url)
        if (!fileResponse.ok) {
          return toolText({ status: 'error', reason: `Could not fetch file: ${fileResponse.status} ${fileResponse.statusText}` })
        }
      } catch (err) {
        return toolText({ status: 'error', reason: `Failed to reach URL: ${err instanceof Error ? err.message : String(err)}` })
      }

      const fileName = url.split('/').pop()?.split('?')[0] || 'upload'
      const blob = await fileResponse.blob()

      const formData = new FormData()
      formData.append('file', blob, fileName)
      if (track_title) formData.append('track_title', track_title)
      if (artist_name) formData.append('artist_name', artist_name)
      if (album_title) formData.append('album_title', album_title)
      if (genre) formData.append('genre', genre)

      try {
        const raw = await libreUpload('/api/v2/files', formData)
        const file = LibreFileSchema.parse(raw)
        return toolText({ status: 'success', file })
      } catch (err) {
        return toolText({ status: 'error', reason: `LibreTime upload failed: ${err instanceof Error ? err.message : String(err)}` })
      }
    }
  )
}
