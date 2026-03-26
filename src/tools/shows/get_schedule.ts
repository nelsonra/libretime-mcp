import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { ScheduleItemSchema } from './types.js'

export function register(server: McpServer) {
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

      const raw = await libreGet('/api/v2/schedule', params)
      const schedule = z.array(ScheduleItemSchema).parse(raw)
      return toolText(schedule)
    }
  )
}
