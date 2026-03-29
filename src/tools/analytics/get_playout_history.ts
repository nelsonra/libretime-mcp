import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { PlayoutHistorySchema, FileMetadataSchema } from './types.js'

export function register(server: McpServer) {
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

      const rawHistory = await libreGet('/api/v2/playout-history', params)
      const history = z.array(PlayoutHistorySchema).parse(rawHistory)

      // Collect unique file IDs then fetch metadata in parallel
      const fileIds = [...new Set(history.map((h) => h.file).filter((id): id is number => id !== null))]
      const rawFiles = await Promise.allSettled(fileIds.map((id) => libreGet(`/api/v2/files/${id}`)))
      const files = rawFiles
        .map((r) => r.status === 'fulfilled' ? FileMetadataSchema.safeParse(r.value) : null)
        .flatMap((r) => (r?.success ? [r.data] : []))

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

      return toolText(enriched)
    }
  )
}
