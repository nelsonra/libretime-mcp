# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project Overview

**libretime-mcp** — a standalone [Model Context Protocol](https://modelcontextprotocol.io) server that bridges Claude (or any MCP-compatible AI client) to a [LibreTime](https://libretime.org) radio station via its REST API.

The goal is to be simple, self-contained, and shareable — anyone running LibreTime can point this server at their instance and get AI tooling for free.

The LibreTime OpenAPI spec lives in `schema.yml` — use it as the source of truth when adding new tools or checking endpoint shapes.

## Architecture

Two separate server entry points, both using stdio transport (compatible with Claude Desktop and MCP clients that spawn a subprocess):

| Entry point | Name | Tools included |
|---|---|---|
| `src/server-client.ts` | `libretime-mcp-client` | Shows, schedule, stream state (read-only) |
| `src/server-admin.ts` | `libretime-mcp-admin` | All client tools + analytics + admin (files, users, hosts) |

Use `server-client` for public-facing or lower-trust contexts. Use `server-admin` when the user needs full control.

## File Structure

```
libretime-mcp/
├── schema.yml                  ← LibreTime OpenAPI spec (reference when building tools)
├── package.json
├── tsconfig.json
└── src/
    ├── server-client.ts        ← Read-only MCP server entry point
    ├── server-admin.ts         ← Full-access MCP server entry point
    ├── libretime.ts            ← HTTP client (Basic Auth): libreGet, librePost, librePatch, libreDelete, libreUpload
    └── tools/
        ├── shows.ts            ← get_shows, get_schedule, get_stream_state
        ├── analytics.ts        ← get_listener_counts, get_playout_history
        └── admin.ts            ← search_files, upload_file, update_file_metadata, delete_file, get_users, get_hosts
```

## Commands

```bash
# Dev (runs with tsx watch, restarts on save)
npm run dev:client       # read-only server
npm run dev:admin        # full-access server

# Build TypeScript → dist/
npm run build

# Run built output
npm run start:client
npm run start:admin
```

## Environment Variables

```
LIBRETIME_URL=https://your-libretime-instance.example.com
LIBRETIME_USER=your_api_username
LIBRETIME_PASS=your_api_password
```

All three are required. The HTTP client reads them at startup from `src/libretime.ts`.

## Using with Claude Desktop

Add one of the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "libretime": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/libretime-mcp/src/server-client.ts"],
      "env": {
        "LIBRETIME_URL": "https://your-instance.example.com",
        "LIBRETIME_USER": "user",
        "LIBRETIME_PASS": "pass"
      }
    }
  }
}
```

Or use the built output (`node dist/server-client.js`) if you've run `npm run build`.

## Adding New Tools

1. Check `schema.yml` for the endpoint shape and available query params.
2. Add the type and `registerTool` call to the appropriate file in `src/tools/`.
3. Import and register it in `server-client.ts` and/or `server-admin.ts` depending on access level.
4. The `libreGet` / `librePost` / `librePatch` / `libreDelete` helpers in `libretime.ts` cover all HTTP methods — use them rather than calling `fetch` directly.

## Current Tools

| Tool | Server | LibreTime Endpoint |
|---|---|---|
| `get_shows` | both | `GET /api/v2/shows` |
| `get_schedule` | both | `GET /api/v2/schedule` |
| `get_stream_state` | both | `GET /api/v2/stream/state` |
| `get_listener_counts` | admin | `GET /api/v2/listener-counts` + `/api/v2/mount-names` |
| `get_playout_history` | admin | `GET /api/v2/playout-history` + `/api/v2/files/{id}` |
| `search_files` | admin | `GET /api/v2/files` |
| `upload_file` | admin | `POST /api/v2/files` (multipart) |
| `update_file_metadata` | admin | `PATCH /api/v2/files/{id}` |
| `delete_file` | admin | `DELETE /api/v2/files/{id}` |
| `get_users` | admin | `GET /api/v2/users` |
| `get_hosts` | admin | `GET /api/v2/show-hosts` + `/api/v2/users` |

## Planned Tools

| Tool | Endpoint |
|---|---|
| `get_show` | `GET /api/v2/shows/{id}` |
| `get_show_instances` | `GET /api/v2/show-instances` |
| `create_show` | `POST /api/v2/shows` |
| `get_station_info` | `GET /api/v2/info` (no auth needed) |
