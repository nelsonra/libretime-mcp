import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet, librePost, librePatch, libreDelete, libreUpload } from '../libretime.js'

type LibreFile = {
  id: number
  name: string
  track_title: string | null
  artist_name: string | null
  album_title: string | null
  genre: string | null
  length: string | null
  mime: string
  import_status: number
  created_at: string | null
  last_played_at: string | null
}

type User = {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  type: string
}

type ShowHost = {
  id: number
  show: number
  user: number
}

export function register(server: McpServer) {
  // ---- Files ---------------------------------------------------------------

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

      const files = await libreGet<LibreFile[]>('/api/v2/files', params)
      const trimmed = files.map(({ id, name, track_title, artist_name, album_title, genre, length, mime, import_status, created_at, last_played_at }) => ({
        id, name, track_title, artist_name, album_title, genre, length, mime, import_status, created_at, last_played_at,
      }))
      return { content: [{ type: 'text', text: JSON.stringify(trimmed) }] }
    }
  )

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
      // No URL — signal the client to trigger the local file upload workflow
      if (!url) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ status: 'upload_required', action: 'file_upload' }),
          }],
        }
      }

      // Fetch the file from the provided URL
      let fileResponse: Response
      try {
        fileResponse = await fetch(url)
        if (!fileResponse.ok) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ status: 'error', reason: `Could not fetch file: ${fileResponse.status} ${fileResponse.statusText}` }),
            }],
          }
        }
      } catch (err) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ status: 'error', reason: `Failed to reach URL: ${err instanceof Error ? err.message : String(err)}` }),
          }],
        }
      }

      // Derive filename from URL, fall back to 'upload'
      const fileName = url.split('/').pop()?.split('?')[0] || 'upload'
      const blob = await fileResponse.blob()

      const formData = new FormData()
      formData.append('file', blob, fileName)
      if (track_title) formData.append('track_title', track_title)
      if (artist_name) formData.append('artist_name', artist_name)
      if (album_title) formData.append('album_title', album_title)
      if (genre) formData.append('genre', genre)

      try {
        const result = await libreUpload<LibreFile>('/api/v2/files', formData)
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ status: 'success', file: result }),
          }],
        }
      } catch (err) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ status: 'error', reason: `LibreTime upload failed: ${err instanceof Error ? err.message : String(err)}` }),
          }],
        }
      }
    }
  )

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

      const result = await librePatch<LibreFile>(`/api/v2/files/${file_id}`, body)
      return { content: [{ type: 'text', text: JSON.stringify(result) }] }
    }
  )

  server.registerTool(
    'delete_file',
    {
      description: 'Delete a file from the LibreTime media library by its ID.',
      inputSchema: {
        file_id: z.number().describe('ID of the file to delete'),
      },
    },
    async ({ file_id }) => {
      await libreDelete(`/api/v2/files/${file_id}`)
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, deleted_id: file_id }) }] }
    }
  )

  // ---- Users ---------------------------------------------------------------

  server.registerTool(
    'get_users',
    {
      description:
        'List all LibreTime users (presenters and admins). Returns id, username, name, email, and role. Roles: G = Guest, H = Host, P = Manager, A = Admin.',
    },
    async () => {
      const users = await libreGet<User[]>('/api/v2/users')
      const trimmed = users.map(({ id, username, first_name, last_name, email, type }) => ({
        id, username, first_name, last_name, email, role: type,
      }))
      return { content: [{ type: 'text', text: JSON.stringify(trimmed) }] }
    }
  )

  // ---- Show Hosts ----------------------------------------------------------

  server.registerTool(
    'get_hosts',
    {
      description:
        'Get all show-to-host assignments. Enriches each entry with user details so you can see which presenter hosts which show by name.',
    },
    async () => {
      const [hosts, users] = await Promise.all([
        libreGet<ShowHost[]>('/api/v2/show-hosts'),
        libreGet<User[]>('/api/v2/users'),
      ])

      const userMap = new Map(users.map((u) => [u.id, u]))

      const enriched = hosts.map(({ id, show, user }) => {
        const u = userMap.get(user)
        return {
          id,
          show_id: show,
          user_id: user,
          username: u?.username ?? null,
          name: u ? `${u.first_name} ${u.last_name}`.trim() : null,
        }
      })

      return { content: [{ type: 'text', text: JSON.stringify(enriched) }] }
    }
  )
}
