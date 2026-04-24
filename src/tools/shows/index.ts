import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { register as registerGetShows } from './get_shows.js'
import { register as registerGetShow } from './get_show.js'
import { register as registerGetShowInstances } from './get_show_instances.js'
import { register as registerGetSchedule } from './get_schedule.js'
import { register as registerGetStreamState } from './get_stream_state.js'
import { register as registerGetStationInfo } from './get_station_info.js'

export function register(server: McpServer) {
  registerGetShows(server)
  registerGetShow(server)
  registerGetShowInstances(server)
  registerGetSchedule(server)
  registerGetStreamState(server)
  registerGetStationInfo(server)
}
