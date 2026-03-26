import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { libreDelete } from '../../libretime.js'
import { toolText } from '../../tool-response.js'

export function register(server: McpServer) {
  server.registerTool(
    'delete_file',
    {
      description: 'Delete a file from the LibreTime media library by its ID.',
      inputSchema: {
        file_id: z.number().describe('ID of the file to delete'),
      },
    },
    async ({ file_id }) => {
      await libreDelete(`/api/v2/files/${file_id}`)
      return toolText({ success: true, deleted_id: file_id })
    }
  )
}
