import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { register as registerGetPlaylists } from './get_playlists.js'
import { register as registerCreatePlaylist } from './create_playlist.js'
import { register as registerGetPlaylistContents } from './get_playlist_contents.js'
import { register as registerAddToPlaylist } from './add_to_playlist.js'

export function register(server: McpServer) {
  registerGetPlaylists(server)
  registerCreatePlaylist(server)
  registerGetPlaylistContents(server)
  registerAddToPlaylist(server)
}
