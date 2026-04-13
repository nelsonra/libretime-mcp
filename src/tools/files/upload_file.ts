import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { libreGet, libreUpload } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { LibreFileSchema, LibrarySchema } from './types.js'

// When running via tsx (dev): __dirname is src/tools/files/ → walk up to project root, then into dist/
// When running compiled:      __dirname is dist/tools/files/ → walk up two levels to dist/
const HTML_PATH = import.meta.filename.endsWith('.ts')
  ? path.join(import.meta.dirname, '../../../dist/apps/upload-file.html')
  : path.join(import.meta.dirname, '../../apps/upload-file.html')

const resourceUri = 'ui://libretime/upload-file.html'

const metadataFields = {
  track_title: z.string().optional().describe('Track title'),
  artist_name: z.string().optional().describe('Artist name'),
  album_title: z.string().optional().describe('Album title'),
  genre: z.string().optional().describe('Genre'),
  library: z.number().optional().describe('Track type / library ID'),
}

export function register(server: McpServer, uploadUrl?: string, uploadToken?: string) {
  registerAppTool(
    server,
    'upload_file',
    {
      description:
        'Upload an audio file to the LibreTime media library. When no URL is provided, opens a file picker. Optionally pre-fill metadata such as track title, artist, album, and genre.',
      inputSchema: {
        url: z.string().optional().describe('Publicly accessible URL of the audio file to upload'),
        ...metadataFields,
      },
      _meta: { ui: { resourceUri } },
    },
    async ({ url, track_title, artist_name, album_title, genre, library }) => {
      if (!url) {
        // Fetch track type options for the UI dropdown
        let libraries: unknown[] = []
        try {
          const raw = await libreGet('/api/v2/libraries')
          libraries = LibrarySchema.array().parse(raw)
        } catch {
          // Non-fatal — UI will just show no dropdown
        }

        // No URL — hand off to the UI.
        // If this is the HTTP server, include an upload_url so the UI can POST directly.
        // If this is stdio, upload_url is null and the UI will ask for a URL instead.
        return toolText({
          status: uploadUrl ? 'upload_ready' : 'upload_required',
          upload_url: uploadUrl ?? null,
          upload_token: uploadToken ?? null,
          libraries,
        })
      }

      let fileResponse: Response
      try {
        fileResponse = await fetch(url)
        if (!fileResponse.ok) {
          return toolText({
            status: 'error',
            reason: `Could not fetch file: ${fileResponse.status} ${fileResponse.statusText}`,
          })
        }
      } catch (err) {
        return toolText({
          status: 'error',
          reason: `Failed to reach URL: ${err instanceof Error ? err.message : String(err)}`,
        })
      }

      const fileName = url.split('/').pop()?.split('?')[0] || 'upload'
      const blob = await fileResponse.blob()
      const formData = new FormData()
      formData.append('file', blob, fileName)
      // Required fields — LibreTime rejects the upload without these
      formData.append('name', fileName)
      formData.append('size', String(blob.size))
      formData.append('mime', blob.type || 'audio/mpeg')
      formData.append('accessed', String(Math.floor(Date.now() / 1000)))
      if (track_title) formData.append('track_title', track_title)
      if (artist_name) formData.append('artist_name', artist_name)
      if (album_title) formData.append('album_title', album_title)
      if (genre) formData.append('genre', genre)
      if (library) formData.append('library', String(library))

      try {
        const raw = await libreUpload('/api/v2/files', formData)
        const file = LibreFileSchema.parse(raw)
        return toolText({ status: 'success', file })
      } catch (err) {
        return toolText({
          status: 'error',
          reason: `LibreTime upload failed: ${err instanceof Error ? err.message : String(err)}`,
        })
      }
    }
  )

  // Serve the bundled React app HTML.
  // When an upload URL is configured, allow the iframe to connect to it (CSP connect-src).
  registerAppResource(
    server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(HTML_PATH, 'utf-8')
      return {
        contents: [
          {
            uri: resourceUri,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            ...(uploadUrl && {
              _meta: { ui: { csp: { connectDomains: [uploadUrl] } } },
            }),
          },
        ],
      }
    }
  )
}
