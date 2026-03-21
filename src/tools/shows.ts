import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../libretime.js'

type Show = {
  id: number
  name: string
  description: string
  genre: string
  url: string
}

type ScheduleItem = {
  id: number
  starts: string
  ends: string
  show_id: number
  show_name: string
  broadcasted: number
}

type StreamState = {
  source_enabled: boolean
  [key: string]: unknown
}

export function register(server: McpServer) {
  server.registerTool(
    'get_shows',
    {
      description: "List all shows registered in LibreTime. Returns each show's id, name, description, and genre.",
    },
    async () => {
      const shows = await libreGet<Show[]>('/api/v2/shows')
      const trimmed = shows.map(({ id, name, description, genre, url }) => ({ id, name, description, genre, url }))
      return { content: [{ type: 'text', text: JSON.stringify(trimmed) }] }
    }
  )

  server.registerTool(
    'get_schedule',
    {
      description:
        'Get the broadcast schedule for a date range. Use starts_after and starts_before to filter by date (ISO 8601 format, e.g. 2024-06-01T00:00:00Z).',
      inputSchema: {
        starts_after: z.string().describe('Return items starting after this datetime (ISO 8601)'),
        starts_before: z.string().describe('Return items starting before this datetime (ISO 8601)'),
      },
    },
    async ({ starts_after, starts_before }) => {
      const params: Record<string, string> = {}
      if (starts_after) params.starts_after = starts_after
      if (starts_before) params.starts_before = starts_before

      const schedule = await libreGet<ScheduleItem[]>('/api/v2/schedule', params)
      return { content: [{ type: 'text', text: JSON.stringify(schedule) }] }
    }
  )

  server.registerTool(
    'get_stream_state',
    { description: 'Check whether the PowerFM station is currently broadcasting live.' },
    async () => {
      const state = await libreGet<StreamState>('/api/v2/stream/state')
      return { content: [{ type: 'text', text: JSON.stringify(state) }] }
    }
  )
}
