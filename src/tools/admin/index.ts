import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { register as registerGetUsers } from './get_users.js'
import { register as registerGetHosts } from './get_hosts.js'
import { register as registerCreateShow } from '../shows/create_show.js'
import { register as registerScheduleFile } from '../shows/schedule_file.js'

export function register(server: McpServer) {
  registerGetUsers(server)
  registerGetHosts(server)
  registerCreateShow(server)
  registerScheduleFile(server)
}
