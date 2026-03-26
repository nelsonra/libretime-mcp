import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { register as registerGetUsers } from './get_users.js'
import { register as registerGetHosts } from './get_hosts.js'

export function register(server: McpServer) {
  registerGetUsers(server)
  registerGetHosts(server)
}
