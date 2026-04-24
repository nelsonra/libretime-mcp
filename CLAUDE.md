# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project Overview

**libretime-mcp** — a standalone [Model Context Protocol](https://modelcontextprotocol.io) server that bridges Claude (or any MCP-compatible AI client) to a [LibreTime](https://libretime.org) radio station via its REST API.

The goal is to be simple, self-contained, and shareable — anyone running LibreTime can point this server at their instance and get AI tooling for free.

The LibreTime OpenAPI spec lives in `schema.yml` — use it as the source of truth when adding new tools or checking endpoint shapes.

## Architecture

Four server entry points — stdio variants for Claude Desktop subprocess mode, HTTP variants for network access with API key auth:

| Entry point | Transport | Name | Tools |
|---|---|---|---|
| `src/stdio/client.ts` | stdio | `libretime-mcp-client` | Shows, schedule, stream state (read-only) |
| `src/stdio/admin.ts` | stdio | `libretime-mcp-admin` | All client tools + analytics + admin |
| `src/http/client.ts` | HTTP (port 3001) | `libretime-mcp-client` | Shows, schedule, stream state (read-only) |
| `src/http/admin.ts` | HTTP (port 3000) | `libretime-mcp-admin` | All client tools + analytics + admin |

The HTTP servers expose a single `POST /mcp` endpoint using MCP Streamable HTTP transport. All requests require `Authorization: Bearer <MCP_API_KEY>`.

Use stdio for local Claude Desktop. Use HTTP when you need to call the server over the network (e.g. from powerfm-agent or other clients).

## File Structure

```
libretime-mcp/
├── schema.yml                       ← LibreTime OpenAPI spec (reference when building tools)
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── tests/
│   ├── helpers.ts                   ← createTestClient, parseResult, jsonResponse, blobResponse
│   └── tools/
│       ├── shows/                   ← mirrors src/tools/shows/
│       ├── analytics/               ← mirrors src/tools/analytics/
│       └── admin/                   ← mirrors src/tools/admin/
└── src/
    ├── stdio/
    │   ├── client.ts                ← Read-only MCP server (stdio, for Claude Desktop)
    │   └── admin.ts                 ← Full-access MCP server (stdio, for Claude Desktop)
    ├── http/
    │   ├── client.ts                ← Read-only MCP server (HTTP, port 3001)
    │   └── admin.ts                 ← Full-access MCP server (HTTP, port 3000)
    ├── libretime.ts                 ← HTTP client (Basic Auth): libreGet, librePost, librePatch, libreDelete, libreUpload
    ├── tool-response.ts             ← toolText() helper — wraps data in MCP content shape
    └── tools/
        ├── shows/
        │   ├── types.ts             ← Zod schemas: ShowSchema, ScheduleItemSchema, StreamStateSchema
        │   ├── get_shows.ts
        │   ├── get_schedule.ts
        │   ├── get_stream_state.ts
        │   └── index.ts             ← barrel: register(server) calls all three
        ├── analytics/
        │   ├── types.ts             ← Zod schemas: ListenerCountSchema, PlayoutHistorySchema, etc.
        │   ├── get_listener_counts.ts
        │   ├── get_playout_history.ts
        │   └── index.ts
        └── admin/
            ├── types.ts             ← Zod schemas: LibreFileSchema, UserSchema, ShowHostSchema
            ├── search_files.ts
            ├── upload_file_legacy.ts  ← active: POST /rest/media (API key auth)
            ├── upload_file.ts         ← benched: POST /api/v2/files (DRF, analyzer not wired)
            ├── update_file_metadata.ts
            ├── delete_file.ts
            ├── get_users.ts
            ├── get_hosts.ts
            └── index.ts
```

## Commands

```bash
# Dev (runs with tsx watch, restarts on save)
npm run dev:client          # read-only server (stdio)
npm run dev:admin           # full-access server (stdio)
npm run dev:client-http     # read-only server (HTTP, port 3001)
npm run dev:admin-http      # full-access server (HTTP, port 3000)

# Build TypeScript → dist/
npm run build

# Run built output
npm run start:client
npm run start:admin
npm run start:client-http
npm run start:admin-http

# Tests (Vitest)
npm test
npm run test:watch

# Generate a random API key
npm run generate:key
```

## Environment Variables

```
LIBRETIME_URL=https://your-libretime-instance.example.com
LIBRETIME_USER=your_api_username
LIBRETIME_PASS=your_api_password

# Required for file upload (both stdio and HTTP admin)
LIBRETIME_API_KEY=your_libretime_api_key   # general.api_key from LibreTime config.yml

# Required for HTTP servers only
MCP_API_KEY=your_secret_api_key
MCP_PORT=3000        # optional, defaults to 3000 (admin) or 3001 (client)
CORS_ORIGIN=https://your-frontend.example.com  # optional, restricts CORS to a specific origin (default: reflect any origin)
MCP_PUBLIC_URL=https://mcp.yourstation.com     # optional, HTTP admin only — public URL for the file upload UI to POST to (defaults to http://localhost:<MCP_PORT>)
UPLOAD_PORT=4000     # optional, stdio admin only — port for the sidecar upload HTTP server (defaults to 4000)
```

Generate a key: `npm run generate:key`

## Using with Claude Desktop

Add one of the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "libretime": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/libretime-mcp/src/stdio/client.ts"],
      "env": {
        "LIBRETIME_URL": "https://your-instance.example.com",
        "LIBRETIME_USER": "user",
        "LIBRETIME_PASS": "pass"
      }
    }
  }
}
```

Or use the built output (`node dist/stdio/client.js`) if you've run `npm run build`.

## Adding New Tools

1. Check `schema.yml` for the endpoint shape and available query params.
2. Create a new file in the appropriate `src/tools/<category>/` subdirectory. Each file exports one `register(server: McpServer)` function.
3. Add a Zod schema for the response shape in the category's `types.ts`. Use `z.infer<typeof Schema>` to derive the TypeScript type — no duplication.
4. Call `libreGet` / `librePost` / `librePatch` / `libreDelete` from `libretime.ts` — all return `Promise<unknown>`, so always validate with Zod before using the result.
5. Return `toolText(data)` from `tool-response.ts` — wraps data in the MCP content shape.
6. Register the new tool in the category's `index.ts` barrel, then wire it up in `stdio/client.ts` and/or `stdio/admin.ts` (and their `http/` counterparts) based on access level.
7. Add a matching test file under `tests/tools/<category>/` mirroring the source path.

## Current Tools

| Tool | Server | LibreTime Endpoint |
|---|---|---|
| `get_shows` | both | `GET /api/v2/shows` |
| `get_show` | both | `GET /api/v2/shows/{id}` |
| `get_show_instances` | both | `GET /api/v2/show-instances` |
| `get_schedule` | both | `GET /api/v2/schedule` |
| `get_stream_state` | both | `GET /api/v2/stream/state` |
| `get_station_info` | both | `GET /api/v2/info` |
| ~~`get_listener_counts`~~ | disabled | API returns full history (~120k records) with no server-side filtering |
| `get_playout_history` | admin | `GET /api/v2/playout-history` + `/api/v2/files/{id}` |
| `search_files` | admin | `GET /api/v2/files` |
| `upload_file` | admin | `POST /rest/media` (legacy PHP, API key auth) |
| `update_file_metadata` | admin | `PATCH /api/v2/files/{id}` |
| `delete_file` | admin | `DELETE /api/v2/files/{id}` |
| `get_users` | admin | `GET /api/v2/users` |
| `get_hosts` | admin | `GET /api/v2/show-hosts` + `/api/v2/users` |
| `create_show` | admin | `POST /api/v2/shows` |
| `schedule_file` | admin | `POST /api/v2/schedule` |
| `get_playlists` | admin | `GET /api/v2/playlists` |
| `create_playlist` | admin | `POST /api/v2/playlists` |
| `get_playlist_contents` | admin | `GET /api/v2/playlist-contents` |
| `add_to_playlist` | admin | `POST /api/v2/playlist-contents` |
