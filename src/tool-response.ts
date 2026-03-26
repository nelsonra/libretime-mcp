/**
 * Wraps any JSON-serialisable value in the MCP text content response shape.
 * Use this in every tool handler instead of writing the structure inline.
 */
export const toolText = (data: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(data) }],
})
