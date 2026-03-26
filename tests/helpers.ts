import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

/**
 * Spins up a real McpServer + Client connected via InMemoryTransport.
 * Registers tools via the provided function and returns the connected client.
 */
export async function createTestClient(register: (server: McpServer) => void): Promise<Client> {
  const server = new McpServer({ name: 'test', version: '0.0.1' })
  register(server)

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await server.connect(serverTransport)

  const client = new Client({ name: 'test-client', version: '0.0.1' })
  await client.connect(clientTransport)

  return client
}

/** Parses the JSON text from the first content block of a tool result. */
export function parseResult(result: CallToolResult): unknown {
  const block = result.content[0]
  if (block.type !== 'text') throw new Error('Expected text content block')
  return JSON.parse(block.text)
}

/** Creates a mock fetch response that returns JSON. */
export function jsonResponse(data: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Internal Server Error',
    json: () => Promise.resolve(data),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
  }
}

/** Creates a mock fetch response for a binary file download. */
export function blobResponse(content = 'audio-data') {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    blob: () => Promise.resolve(new Blob([content])),
  }
}
