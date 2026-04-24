# libretime-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that connects Claude (or any MCP-compatible AI client) to a [LibreTime](https://libretime.org) radio station via its REST API. Ask Claude to check your schedule, manage files, pull listener stats, and more — directly from your station.

Two ways to run it:
- **stdio** — Claude Desktop spawns it as a subprocess. No hosting required. Best if you just want AI tooling on your own machine.
- **HTTP** — Self-host it as a network server. Best for advanced setups where you want to connect a remote MCP client or integrate with another service.

## Tools

Tools are organised into subdirectories under `src/tools/` — one file per tool.

**Read-only (client & admin)**
- `get_shows` — list all shows
- `get_show` — get a single show by ID
- `get_show_instances` — list scheduled show slots (filterable by show, date range)
- `get_schedule` — broadcast schedule
- `get_stream_state` — current on-air state
- `get_station_info` — station name, timezone, and configuration

**Analytics (admin)**
- ~~`get_listener_counts`~~ — disabled (API returns full history with no filtering, ~120k records)
- `get_playout_history` — recent playout history with track metadata

**Media library (admin)**
- `search_files` — search your media library
- `upload_file` — upload an audio file via drag-and-drop UI (works in both stdio and HTTP modes — see [File Upload](#file-upload))
- `update_file_metadata` — edit track metadata
- `delete_file` — remove a file

**Shows & scheduling (admin)**
- `create_show` — create a new show
- `schedule_file` — schedule an uploaded file into a show instance

**Playlists (admin)**
- `get_playlists` — list all playlists
- `create_playlist` — create a new playlist
- `get_playlist_contents` — list items in a playlist
- `add_to_playlist` — add a file or stream to a playlist

**Users (admin)**
- `get_users` — list station users (pass `include_email: true` to include email addresses, omitted by default)
- `get_hosts` — list show hosts with their show assignments

## File Upload

`upload_file` renders a drag-and-drop UI in the Claude chat window. It works the same way in both transport modes:

- **HTTP mode** — the UI posts directly to the MCP server's `/upload` endpoint
- **stdio mode** — the admin server spins up a lightweight sidecar HTTP server (default port `4000`) that the UI posts to. The MCP protocol itself continues over stdio; the upload is a side-channel.

Both modes use the same upload token generated at startup, so there's no separate configuration needed. To change the sidecar port in stdio mode set `UPLOAD_PORT` in your environment.

## Option 1 — Claude Desktop (stdio)

No hosting required. Claude Desktop spawns the server as a subprocess and manages its lifecycle.

### Global install

```bash
npm install -g @powerfm/libretime-mcp
```

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "libretime": {
      "command": "libretime-mcp",
      "args": [],
      "env": {
        "LIBRETIME_URL": "https://your-instance.example.com",
        "LIBRETIME_USER": "user",
        "LIBRETIME_PASS": "pass",
        "LIBRETIME_API_KEY": "your_libretime_api_key"
      }
    }
  }
}
```

`LIBRETIME_API_KEY` is the `general.api_key` value from your LibreTime `config.yml`. It is required for file uploads — omit it if you are using the read-only client.

Use `libretime-mcp-client` instead of `libretime-mcp` for read-only access.

### npx (no install)

```json
{
  "mcpServers": {
    "libretime": {
      "command": "npx",
      "args": ["@powerfm/libretime-mcp"],
      "env": {
        "LIBRETIME_URL": "https://your-instance.example.com",
        "LIBRETIME_USER": "user",
        "LIBRETIME_PASS": "pass"
      }
    }
  }
}
```

### From source

Clone the repo, create a `.env` file with your credentials (see [Development](#development) below), then point Claude Desktop at the local build:

```json
{
  "mcpServers": {
    "libretime": {
      "command": "node",
      "args": ["/absolute/path/to/libretime-mcp/dist/stdio/admin.js"],
      "env": {
        "LIBRETIME_URL": "https://your-instance.example.com",
        "LIBRETIME_USER": "user",
        "LIBRETIME_PASS": "pass"
      }
    }
  }
}
```

## Option 2 — Self-hosted HTTP server

Best for advanced setups — connect any MCP-compatible client over the network.

**Install:**
```bash
npm install -g @powerfm/libretime-mcp
```

**Set environment variables:**
```bash
LIBRETIME_URL=https://your-libretime-instance.example.com
LIBRETIME_USER=your_api_username
LIBRETIME_PASS=your_api_password
MCP_API_KEY=your_secret_api_key     # clients must send this as a Bearer token
MCP_PORT=3000                        # optional, defaults to 3000 (admin) / 3001 (client)
CORS_ORIGIN=https://your-app.example.com  # optional, lock CORS to a specific origin (default: reflect any)
```

Generate a random API key:
```bash
libretime-mcp-keygen
```

**Start the server:**
```bash
libretime-mcp-http           # full access, port 3000
libretime-mcp-client-http    # read-only, port 3001
```

**Clients must send:**
```
POST /mcp
Authorization: Bearer <MCP_API_KEY>
```

Requests without a valid key receive `401 Unauthorized`.

## Development

```bash
git clone https://github.com/nelsonra/libretime-mcp.git
cd libretime-mcp
npm install
cp .env.example .env   # fill in your credentials
```

```bash
# Dev (tsx watch — restarts on save)
npm run dev:client          # read-only stdio
npm run dev:admin           # full-access stdio
npm run dev:client-http     # read-only HTTP (port 3001)
npm run dev:admin-http      # full-access HTTP (port 3000)

# Build
npm run build

# Tests
npm test

# MCP Inspector — browse and call tools interactively
npm run inspect:admin           # stdio admin server
npm run inspect:client          # stdio read-only server
npm run inspect:admin-http      # HTTP admin (start the server first, then run this)
npm run inspect:client-http     # HTTP read-only (start the server first, then run this)
```

The inspector opens a browser UI at `http://localhost:5173` where you can list tools, see their schemas, and call them with custom inputs.

## Servers

| Command | Transport | Port | Access |
|---|---|---|---|
| `libretime-mcp` | stdio | — | Admin |
| `libretime-mcp-client` | stdio | — | Read-only |
| `libretime-mcp-http` | HTTP | 3000 | Admin |
| `libretime-mcp-client-http` | HTTP | 3001 | Read-only |
