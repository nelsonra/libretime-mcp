import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { register as registerSearchFiles } from './search_files.js'
import { register as registerUploadFile } from './upload_file_legacy.js'
import { register as registerUpdateFileMetadata } from './update_file_metadata.js'
import { register as registerDeleteFile } from './delete_file.js'

export function register(server: McpServer, uploadUrl?: string, uploadToken?: string) {
  registerSearchFiles(server)
  registerUploadFile(server, uploadUrl, uploadToken)
  registerUpdateFileMetadata(server)
  registerDeleteFile(server)
}
