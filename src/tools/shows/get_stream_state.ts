import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { libreGet } from '../../libretime.js'
import { toolText } from '../../tool-response.js'
import { StreamStateSchema } from './types.js'

export function register(server: McpServer) {
  server.registerTool(
    'get_stream_state',
    { description: 'Check whether the PowerFM station is currently broadcasting live.' },
    async () => {
      const raw = await libreGet('/api/v2/stream/state')
      const state = StreamStateSchema.parse(raw)
      return toolText(state)
    }
  )
}
