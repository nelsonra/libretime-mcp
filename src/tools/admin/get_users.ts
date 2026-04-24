import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { UserSchema } from './types.js'

export function register(server: McpServer) {
  server.tool(
    'get_users',
    'List all LibreTime users (presenters and admins). Returns id, username, name, and role. Roles: G = Guest, H = Host, P = Manager, A = Admin.',
    {
      include_email: z.boolean().optional().describe('Include email addresses in the response (default: false)'),
    },
    async ({ include_email = false }) => {
      const raw = await libreGet('/api/v2/users')
      const users = z.array(UserSchema).parse(raw)
      const trimmed = users.map(({ id, username, first_name, last_name, email, role }) => ({
        id,
        username,
        first_name,
        last_name,
        ...(include_email ? { email } : {}),
        role,
      }))
      return toolText(trimmed)
    }
  )
}
