import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { UserSchema } from './types.js'

export function register(server: McpServer) {
  server.registerTool(
    'get_users',
    {
      description:
        'List all LibreTime users (presenters and admins). Returns id, username, name, email, and role. Roles: G = Guest, H = Host, P = Manager, A = Admin.',
    },
    async () => {
      const raw = await libreGet('/api/v2/users')
      const users = z.array(UserSchema).parse(raw)
      const trimmed = users.map(({ id, username, first_name, last_name, email, role }) => ({
        id, username, first_name, last_name, email, role,
      }))
      return toolText(trimmed)
    }
  )
}
