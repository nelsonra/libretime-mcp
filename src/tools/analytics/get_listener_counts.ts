import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { ListenerCountSchema, MountNameSchema } from './types.js'

export function register(server: McpServer) {
  server.registerTool(
    'get_listener_counts',
    {
      description:
        'Get listener count history for PowerFM streams. Returns the most recent entries per mount point with timestamps. Useful for understanding peak listening times and audience size.',
      inputSchema: {
        limit: z.number().int().min(1).max(500).default(100).describe('Number of most recent entries to return (default 100, max 500)'),
      },
    },
    async ({ limit }) => {
      const [rawCounts, rawMounts] = await Promise.all([
        libreGet('/api/v2/listener-counts'),
        libreGet('/api/v2/mount-names'),
      ])

      const counts = z.array(ListenerCountSchema).parse(rawCounts)
      const mounts = z.array(MountNameSchema).parse(rawMounts)

      const mountMap = new Map(mounts.map((m) => [m.id, m.mount_name]))

      const enriched = counts
        .slice(-limit)
        .map(({ id, listener_count, timestamp, mount_name }) => ({
          id,
          listener_count,
          timestamp,
          mount: mountMap.get(mount_name) ?? `mount_${mount_name}`,
        }))

      return toolText(enriched)
    }
  )
}
