import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { register as registerGetListenerCounts } from './get_listener_counts.js'
import { register as registerGetPlayoutHistory } from './get_playout_history.js'

export function register(server: McpServer) {
  registerGetListenerCounts(server)
  registerGetPlayoutHistory(server)
}
