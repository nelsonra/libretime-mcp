import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { register as registerSearchFiles } from '../files/search_files.js'
import { register as registerUploadFile } from '../files/upload_file.js'
import { register as registerUpdateFileMetadata } from '../files/update_file_metadata.js'
import { register as registerDeleteFile } from '../files/delete_file.js'

export function register(server: McpServer) {
  registerSearchFiles(server)
  registerUploadFile(server)
  registerUpdateFileMetadata(server)
  registerDeleteFile(server)
}
