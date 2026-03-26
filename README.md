# libretime-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that connects Claude (or any MCP-compatible AI client) to a [LibreTime](https://libretime.org) radio station via its REST API. Ask Claude to check your schedule, manage files, pull listener stats, and more — directly from your station.

## Servers

Two access levels, each available in stdio and HTTP flavors:

| Entry point | Transport | Tools |
|---|---|---|
| `src/stdio/client.ts` | stdio | Shows, schedule, stream state (read-only) |
| `src/stdio/admin.ts` | stdio | All client tools + analytics + file/user management |
| `src/http/client.ts` | HTTP :3001 | Same as client, over the network |
| `src/http/admin.ts` | HTTP :3000 | Same as admin, over the network |

Use **stdio** for Claude Desktop. Use **HTTP** for server-to-server integrations (e.g. an AI agent or backend service calling over the network).

## Tools

Tools are organised into subdirectories under `src/tools/` — one file per tool.

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
| `get_hosts` | admin | List show hosts with enriched user details |

## Setup

```bash
npm install @powerfm/libretime-mcp
```

Or run without installing:

```bash
npx @powerfm/libretime-mcp
```

If you're working from source:

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

# Tests
npm test
```

## Using with Claude Desktop (stdio)

Claude Desktop spawns the server as a subprocess and manages its lifecycle — nothing extra to run.

Add to your `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "libretime": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/libretime-mcp/src/stdio/admin.ts"],
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
"args": ["/absolute/path/to/libretime-mcp/dist/stdio/admin.js"]
```

## Using the HTTP Server (server-to-server)

The HTTP servers are designed for network clients — e.g. an AI agent or backend service calling LibreTime tools over the network. Claude Desktop does not support HTTP MCP servers directly; use stdio above for Desktop.

Start the server:

```bash
npm run start:admin-http   # full access, port 3000
npm run start:client-http  # read-only, port 3001
```

All requests must go to `POST /mcp` with the API key header:

```
Authorization: Bearer <MCP_API_KEY>
```

Requests without a valid key receive `401 Unauthorized`.
