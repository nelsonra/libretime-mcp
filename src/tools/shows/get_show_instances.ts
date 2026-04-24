import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { ShowInstanceSchema } from './types.js'

export function register(server: McpServer) {
  server.tool(
    'get_show_instances',
    'List scheduled instances of a show. Optionally filter by show ID or date range.',
    {
      show_id: z.number().optional().describe('Filter by show ID'),
      starts_after: z.string().optional().describe('ISO 8601 datetime — only return instances starting after this time'),
      starts_before: z.string().optional().describe('ISO 8601 datetime — only return instances starting before this time'),
    },
    async ({ show_id, starts_after, starts_before }) => {
      const params: Record<string, string> = {}
      if (show_id !== undefined) params.show = String(show_id)
      if (starts_after) params.starts_after = starts_after
      if (starts_before) params.starts_before = starts_before

      const raw = await libreGet('/api/v2/show-instances', params)
      const instances = ShowInstanceSchema.array().parse(raw)
      return toolText(instances)
    }
  )
}
