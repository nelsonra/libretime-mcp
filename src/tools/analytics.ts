import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../libretime.js'

type ListenerCount = {
  id: number
  listener_count: number
  timestamp: number
  mount_name: number
}

type MountName = {
  id: number
  mount_name: string
}

type PlayoutHistory = {
  id: number
  starts: string
  ends: string | null
  file: number | null
  instance: number | null
}

type FileMetadata = {
  id: number
  track_title: string | null
  artist_name: string | null
  album_title: string | null
  genre: string | null
  length: string | null
}

export function register(server: McpServer) {
  server.registerTool(
    'get_listener_counts',
    {
      description:
        'Get listener count history for PowerFM streams. Returns counts per mount point (stream URL) with timestamps. Useful for understanding peak listening times and audience size.',
    },
    async () => {
      const [counts, mounts] = await Promise.all([
        libreGet<ListenerCount[]>('/api/v2/listener-counts'),
        libreGet<MountName[]>('/api/v2/mount-names'),
      ])

      const mountMap = new Map(mounts.map((m) => [m.id, m.mount_name]))

      const enriched = counts.map(({ id, listener_count, timestamp, mount_name }) => ({
        id,
        listener_count,
        timestamp,
        mount: mountMap.get(mount_name) ?? `mount_${mount_name}`,
      }))

      return { content: [{ type: 'text', text: JSON.stringify(enriched) }] }
    }
  )

  server.registerTool(
    'get_playout_history',
    {
      description:
        'Get the history of tracks that have played on PowerFM. Enriches each entry with track title and artist from the file library. Use starts and ends to filter by time range (ISO 8601).',
      inputSchema: {
        starts: z.string().optional().describe('Return history entries starting after this datetime (ISO 8601)'),
        ends: z.string().optional().describe('Return history entries ending before this datetime (ISO 8601)'),
      },
    },
    async ({ starts, ends }) => {
      const params: Record<string, string> = {}
      if (starts) params.starts = starts
      if (ends) params.ends = ends

      const history = await libreGet<PlayoutHistory[]>('/api/v2/playout-history', params)

      // Collect unique file IDs to enrich in parallel
      const fileIds = [...new Set(history.map((h) => h.file).filter((id): id is number => id !== null))]

      const files = await Promise.all(fileIds.map((id) => libreGet<FileMetadata>(`/api/v2/files/${id}`)))

      const fileMap = new Map(files.map((f) => [f.id, f]))

      const enriched = history.map(({ id, starts, ends, file, instance }) => {
        const meta = file !== null ? fileMap.get(file) : undefined
        return {
          id,
          starts,
          ends,
          instance,
          track_title: meta?.track_title ?? null,
          artist_name: meta?.artist_name ?? null,
          album_title: meta?.album_title ?? null,
          genre: meta?.genre ?? null,
          length: meta?.length ?? null,
        }
      })

      return { content: [{ type: 'text', text: JSON.stringify(enriched) }] }
    }
  )
}
