import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register } from '../../../src/tools/files/delete_file.js'
import { createTestClient, parseResult } from '../../helpers.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('delete_file', () => {
  it('returns success with the deleted file id', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204, statusText: 'No Content' }))
    const client = await createTestClient(register)

    const result = await client.callTool({ name: 'delete_file', arguments: { file_id: 42 } })
    const body = parseResult(result) as { success: boolean; deleted_id: number }

    expect(body.success).toBe(true)
    expect(body.deleted_id).toBe(42)
  })
})
