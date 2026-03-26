import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { ShowHostSchema, UserSchema } from './types.js'

export function register(server: McpServer) {
  server.registerTool(
    'get_hosts',
    {
      description:
        'Get all show-to-host assignments. Enriches each entry with user details so you can see which presenter hosts which show by name.',
    },
    async () => {
      const [rawHosts, rawUsers] = await Promise.all([
        libreGet('/api/v2/show-hosts'),
        libreGet('/api/v2/users'),
      ])

      const hosts = z.array(ShowHostSchema).parse(rawHosts)
      const users = z.array(UserSchema).parse(rawUsers)

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

      return toolText(enriched)
    }
  )
}
