import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { register as registerGetShows } from './get_shows.js'
import { register as registerGetSchedule } from './get_schedule.js'
import { register as registerGetStreamState } from './get_stream_state.js'

export function register(server: McpServer) {
  registerGetShows(server)
  registerGetSchedule(server)
  registerGetStreamState(server)
}
