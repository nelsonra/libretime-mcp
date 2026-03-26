import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register } from '../../../src/tools/admin/get_hosts.js'
import { createTestClient, parseResult, jsonResponse } from '../../helpers.js'

const SHOW_HOSTS = [
  { id: 1, show: 10, user: 1 },
  { id: 2, show: 20, user: 99 }, // unknown user
]

const USERS = [
  { id: 1, username: 'jsmith', first_name: 'John', last_name: 'Smith', email: 'j@example.com', type: 'H' },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('get_hosts', () => {
  it('enriches host assignments with user details', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse(SHOW_HOSTS))
      .mockResolvedValueOnce(jsonResponse(USERS))
    )
    const client = await createTestClient(register)

    const result = await client.callTool({ name: 'get_hosts', arguments: {} })
    const hosts = parseResult(result) as Array<{ show_id: number; username: string | null; name: string | null }>

    expect(hosts[0].username).toBe('jsmith')
    expect(hosts[0].name).toBe('John Smith')
  })

  it('sets username and name to null when user is not found', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse(SHOW_HOSTS))
      .mockResolvedValueOnce(jsonResponse(USERS))
    )
    const client = await createTestClient(register)

    const result = await client.callTool({ name: 'get_hosts', arguments: {} })
    const hosts = parseResult(result) as Array<{ username: string | null; name: string | null }>

    expect(hosts[1].username).toBeNull()
    expect(hosts[1].name).toBeNull()
  })
})
