import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register } from '../../../src/tools/admin/get_users.js'
import { createTestClient, parseResult, jsonResponse } from '../../helpers.js'

const USERS = [
  { id: 1, username: 'jsmith', first_name: 'John', last_name: 'Smith', email: 'j@example.com', type: 'H' },
  { id: 2, username: 'admin', first_name: 'Admin', last_name: 'User', email: 'a@example.com', type: 'A' },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('get_users', () => {
  it('renames type to role in the response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(USERS)))
    const client = await createTestClient(register)

    const result = await client.callTool({ name: 'get_users', arguments: {} })
    const users = parseResult(result) as Array<Record<string, unknown>>

    expect(users[0]).toHaveProperty('role', 'H')
    expect(users[0]).not.toHaveProperty('type')
  })
})
