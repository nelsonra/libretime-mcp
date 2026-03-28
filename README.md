# libretime-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that connects Claude (or any MCP-compatible AI client) to a [LibreTime](https://libretime.org) radio station via its REST API. Ask Claude to check your schedule, manage files, pull listener stats, and more — directly from your station.

Two ways to run it:
- **stdio** — Claude Desktop spawns it as a subprocess. No hosting required. Best if you just want AI tooling on your own machine.
- **HTTP** — Self-host it as a network server. Best for advanced setups where you want to connect a remote MCP client or integrate with another service.

## Tools

Tools are organised into subdirectories under `src/tools/` — one file per tool.

**Read-only (client & admin)**
- `get_shows` — list all shows
- `get_schedule` — broadcast schedule
- `get_stream_state` — current on-air state

**Analytics (admin)**
- `get_listener_counts` — listener stats by mount point
- `get_playout_history` — recent playout history with track metadata

**Media library (admin)**
- `search_files` — search your media library
- `upload_file` — upload an audio file _(stdio only — reads from local filesystem)_
- `update_file_metadata` — edit track metadata
- `delete_file` — remove a file

**Users (admin)**
- `get_users` — list station users
- `get_hosts` — list show hosts

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
        "LIBRETIME_PASS": "pass"
      }
    }
  }
}
```

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
```

## Servers

| Command | Transport | Port | Access |
|---|---|---|---|
| `libretime-mcp` | stdio | — | Admin |
| `libretime-mcp-client` | stdio | — | Read-only |
| `libretime-mcp-http` | HTTP | 3000 | Admin |
| `libretime-mcp-client-http` | HTTP | 3001 | Read-only |
