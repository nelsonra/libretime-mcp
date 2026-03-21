# libretime-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that connects Claude (or any MCP-compatible AI client) to a [LibreTime](https://libretime.org) radio station via its REST API. Ask Claude to check your schedule, manage files, pull listener stats, and more — directly from your station.

## Servers

Two access levels, each available in stdio and HTTP flavors:

| Server | Transport | Tools |
|---|---|---|
| `server-client` | stdio | Shows, schedule, stream state (read-only) |
| `server-admin` | stdio | All client tools + analytics + file/user management |
| `server-client-http` | HTTP :3001 | Same as client, over the network |
| `server-admin-http` | HTTP :3000 | Same as admin, over the network |

Use **stdio** for Claude Desktop (subprocess only — Desktop does not support HTTP MCP servers). Use **HTTP** when calling from a remote client or another service.

## Tools

| Tool | Server | Description |
|---|---|---|
| `get_shows` | both | List shows |
| `get_schedule` | both | Fetch the broadcast schedule |
| `get_stream_state` | both | Current stream/on-air state |
| `get_listener_counts` | admin | Listener stats by mount point |
| `get_playout_history` | admin | Recent playout history with file metadata |
| `search_files` | admin | Search the media library |
| `upload_file` | admin | Upload an audio file |
| `update_file_metadata` | admin | Edit metadata for a file |
| `delete_file` | admin | Delete a file from the library |
| `get_users` | admin | List station users |
| `get_hosts` | admin | List show hosts |

## Setup

```bash
npm install
```

Copy and fill in your environment variables:

```bash
# LibreTime instance (required for all servers)
LIBRETIME_URL=https://your-libretime-instance.example.com
LIBRETIME_USER=your_api_username
LIBRETIME_PASS=your_api_password

# Required for HTTP servers only
MCP_API_KEY=your_secret_api_key
MCP_PORT=3000   # optional, defaults to 3000 (admin) / 3001 (client)
```

Generate a random API key:

```bash
npm run generate:key
```

## Commands

```bash
# Development (tsx watch — restarts on save)
npm run dev:client          # read-only stdio server
npm run dev:admin           # full-access stdio server
npm run dev:client-http     # read-only HTTP server (port 3001)
npm run dev:admin-http      # full-access HTTP server (port 3000)

# Build TypeScript → dist/
npm run build

# Run built output
npm run start:client
npm run start:admin
npm run start:client-http
npm run start:admin-http
```

## Using with Claude Desktop

Claude Desktop only supports stdio (subprocess) — HTTP MCP servers are not supported. Claude Desktop spawns the server as a subprocess and manages its lifecycle.

Add to your `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "libretime": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/libretime-mcp/src/server-admin.ts"],
      "env": {
        "LIBRETIME_URL": "https://your-instance.example.com",
        "LIBRETIME_USER": "user",
        "LIBRETIME_PASS": "pass"
      }
    }
  }
}
```

`npx tsx` resolves from the project's local `node_modules` — no global install needed as long as you've run `npm install` first.

Or point at the built output (`npm run build` first):

```json
"command": "node",
"args": ["/absolute/path/to/libretime-mcp/dist/server-admin.js"]
```

## Using the HTTP Server from Other Clients

All requests must go to `POST /mcp` with the API key header:

```
Authorization: Bearer <MCP_API_KEY>
```

Requests without a valid key receive `401 Unauthorized`.
