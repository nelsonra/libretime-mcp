// Active upload implementation — uses /rest/media (legacy LibreTime PHP endpoint).
//
// Background: /api/v2/files (DRF) creates a DB record but never writes to disk or queues
// the analyzer. /rest/media is the only endpoint that triggers the full import workflow.
// This file stays active until LibreTime wires the analyzer in the DRF endpoint.
//
// When that upstream fix lands, swap index.ts to import from upload_file.ts instead.
// See upload_file.ts for the DRF implementation kept ready for that switch.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { libreGet, libreRestMedia } from '../../libretime.js'
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

const MIME_MAP: Record<string, string> = {
  mp3: 'audio/mpeg',
  flac: 'audio/flac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  opus: 'audio/opus',
}

function inferMime(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  return MIME_MAP[ext] ?? 'audio/mpeg'
}

function appendMetadata(
  formData: FormData,
  fields: { track_title?: string; artist_name?: string; album_title?: string; genre?: string; library?: number }
) {
  if (fields.track_title) formData.append('track_title', fields.track_title)
  if (fields.artist_name) formData.append('artist_name', fields.artist_name)
  if (fields.album_title) formData.append('album_title', fields.album_title)
  if (fields.genre) formData.append('genre', fields.genre)
  if (fields.library) formData.append('library', String(fields.library))
}

export function register(server: McpServer, uploadUrl?: string, uploadToken?: string) {
  registerAppTool(
    server,
    'upload_file',
    {
      description:
        'Upload an audio file to the LibreTime media library. Provide a URL to fetch the file from, or a local file path when running in stdio mode. When neither is given, opens a file picker. Optionally pre-fill metadata such as track title, artist, album, and genre.',
      inputSchema: {
        url: z.string().optional().describe('Publicly accessible URL of the audio file to upload'),
        file_path: z.string().optional().describe('Absolute path to a local audio file — use when running stdio mode'),
        ...metadataFields,
      },
      _meta: { ui: { resourceUri } },
    },
    async ({ url, file_path, track_title, artist_name, album_title, genre, library }) => {
      const meta = { track_title, artist_name, album_title, genre, library }

      // Priority 1: local file path (stdio mode — server runs on the user's machine)
      if (file_path) {
        let fileBuffer: Buffer
        try {
          fileBuffer = await fs.readFile(file_path)
        } catch (err) {
          return toolText({
            status: 'error',
            reason: `Could not read file: ${err instanceof Error ? err.message : String(err)}`,
          })
        }

        const fileName = path.basename(file_path)
        const mime = inferMime(file_path)
        const formData = new FormData()
        formData.append('file', new Blob([new Uint8Array(fileBuffer)], { type: mime }), fileName)
        appendMetadata(formData, meta)

        try {
          const raw = await libreRestMedia(formData)
          const parsed = LibreFileSchema.safeParse(raw)
          return toolText({ status: 'success', file: parsed.success ? parsed.data : raw })
        } catch (err) {
          return toolText({
            status: 'error',
            reason: `LibreTime upload failed: ${err instanceof Error ? err.message : String(err)}`,
          })
        }
      }

      // Priority 2: remote URL — fetch then forward to LibreTime
      if (url) {
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
        formData.append('file', new Blob([await blob.arrayBuffer()], { type: blob.type || inferMime(fileName) }), fileName)
        appendMetadata(formData, meta)

        try {
          const raw = await libreRestMedia(formData)
          const parsed = LibreFileSchema.safeParse(raw)
          return toolText({ status: 'success', file: parsed.success ? parsed.data : raw })
        } catch (err) {
          return toolText({
            status: 'error',
            reason: `LibreTime upload failed: ${err instanceof Error ? err.message : String(err)}`,
          })
        }
      }

      // Priority 3: no input — hand off to the file picker UI
      let libraries: unknown[] = []
      try {
        const raw = await libreGet('/api/v2/libraries')
        libraries = LibrarySchema.array().parse(raw)
      } catch {
        // Non-fatal — UI will just show no dropdown
      }

      return toolText({
        status: uploadUrl ? 'upload_ready' : 'upload_required',
        upload_url: uploadUrl ?? null,
        upload_token: uploadToken ?? null,
        libraries,
      })
    }
  )

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
