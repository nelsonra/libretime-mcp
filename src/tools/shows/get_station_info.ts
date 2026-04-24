import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'

const InfoSchema = z.object({
  station_name: z.string(),
}).passthrough()

export function register(server: McpServer) {
  server.tool(
    'get_station_info',
    'Get basic station information such as the station name.',
    {},
    async () => {
      const raw = await libreGet('/api/v2/info')
      const info = InfoSchema.parse(raw)
      return toolText(info)
    }
  )
}
