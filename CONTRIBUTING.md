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
