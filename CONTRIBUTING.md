# Contributing

This is a public repo with collaborator-only write access. If you'd like to contribute, open an issue or reach out via GitHub — happy to discuss before you invest time in a PR.

## Development setup

```bash
git clone https://github.com/nelsonra/libretime-mcp.git
cd libretime-mcp
npm install
cp .env.example .env   # fill in your LibreTime credentials
```

## Running in dev mode

```bash
npm run dev:client          # read-only stdio (restarts on save)
npm run dev:admin           # full-access stdio
npm run dev:client-http     # read-only HTTP, port 3001
npm run dev:admin-http      # full-access HTTP, port 3000
```

## Testing with Claude Desktop

### stdio (local, no network needed)

The Claude Desktop config is the same as in the [README](README.md#option-1--claude-desktop-stdio) — the only difference when working from source is using `tsx` instead of the installed binary:

```json
{
  "mcpServers": {
    "libretime": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/libretime-mcp/src/stdio/admin.ts"],
      "env": {
        "LIBRETIME_URL": "https://your-instance.example.com",
        "LIBRETIME_USER": "your_user",
        "LIBRETIME_PASS": "your_pass"
      }
    }
  }
}
```

Restart Claude Desktop after saving. Use `src/stdio/client.ts` for read-only access.

---

### HTTP via Cloudflare tunnel (Claude Desktop over the network)

Use this when testing the HTTP server end-to-end, including the file upload UI.

**Prerequisites:** `.env` configured with LibreTime credentials and:
```
MCP_PUBLIC_URL=https://<your-tunnel>.trycloudflare.com
DISABLE_AUTH=true   # Claude Desktop connectors don't support custom headers yet
```

1. **Start a Cloudflare tunnel** (keep this terminal open):
   ```bash
   npx cloudflared tunnel --url http://localhost:3000
   ```
   Copy the generated `https://` URL and set it as `MCP_PUBLIC_URL` in `.env`.

2. **Start the HTTP admin server:**
   ```bash
   npm run dev:admin-http
   ```

3. **Add a connector in Claude Desktop:**
   - Settings → Connectors → Add custom connector
   - URL: `https://<your-tunnel>.trycloudflare.com/mcp`
   - Remove any existing libretime connector first.

4. Start a new conversation and ask: *"I want to upload a file to LibreTime"* — the file picker UI should appear.

> **Verify the tunnel is reachable** by hitting it in a browser. You should see a JSON error response, which confirms the server is up.

---

## Testing the upload UI with basic-host

basic-host is a lightweight local MCP host for testing MCP App UIs without needing Claude Desktop.

1. **Clone the MCP ext-apps repo** at the version matching your installed SDK:
   ```bash
   git clone --branch "v$(npm view @modelcontextprotocol/ext-apps version)" --depth 1 \
     https://github.com/modelcontextprotocol/ext-apps.git /tmp/mcp-ext-apps
   ```

2. **Install and build basic-host:**
   ```bash
   cd /tmp/mcp-ext-apps/examples/basic-host
   npm install
   npm run build
   ```

3. **Start the HTTP admin server** with auth disabled (basic-host doesn't send auth headers):
   ```bash
   # In your libretime-mcp directory
   DISABLE_AUTH=true npm run dev:admin-http
   ```

4. **Start basic-host:**
   ```bash
   SERVERS='["http://localhost:3000/mcp"]' npx tsx serve.ts
   ```

5. Open `http://localhost:8080` in your browser.

6. Find the `upload_file` tool and call it with no arguments — the file picker UI should appear.

> Watch the admin server terminal for `[upload]` telemetry lines showing file size and transfer time when a file is submitted.

---

## Debugging with MCP Inspector

The Inspector gives you a browser UI to call tools and inspect responses.

### stdio servers

```bash
npm run inspect:client   # read-only
npm run inspect:admin    # full access
```

Opens the Inspector UI and spawns the server automatically using your `.env` credentials.

### HTTP servers

Start the server in one terminal:

```bash
npm run dev:admin-http
```

Open the Inspector in another:

```bash
npm run inspect:admin-http   # admin (port 3000)
npm run inspect:client-http  # read-only (port 3001)
```

These pre-configure the transport, URL, and `Authorization` header from your `.env`.

## Running tests

```bash
npm test          # run once
npm run test:watch
```

Tests hit a real LibreTime instance — set credentials in `.env` before running.

## Adding a tool

1. Check `schema.yml` for the endpoint shape and available query params.
2. Create a file in `src/tools/<category>/your_tool.ts`. Export one function:
   ```ts
   export function register(server: McpServer) {
     server.registerTool('tool_name', { description: '...' }, async (args) => {
       const raw = await libreGet('/api/v2/...')
       const data = YourSchema.parse(raw)
       return toolText(data)
     })
   }
   ```
3. Add a Zod schema for the response in the category's `types.ts`.
4. Register in the category's `index.ts` barrel.
5. Wire into the appropriate entry points (`stdio/admin.ts`, `http/admin.ts`, etc.) based on access level.
6. Add a test under `tests/tools/<category>/` mirroring the source path.

## Project structure

See [CLAUDE.md](CLAUDE.md) for the full file structure, environment variables, and current tool inventory.
