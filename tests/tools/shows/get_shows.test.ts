import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register } from '../../../src/tools/shows/get_shows.js'
import { createTestClient, parseResult, jsonResponse } from '../../helpers.js'

const SHOWS = [
  { id: 1, name: 'Morning Drive', description: 'Wake up with us', genre: 'Pop', url: '/shows/1', extra_field: 'should be stripped' },
  { id: 2, name: 'Jazz Hour', description: 'Smooth jazz', genre: 'Jazz', url: '/shows/2', extra_field: 'should be stripped' },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('get_shows', () => {
  it('returns shows with only the expected fields', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(SHOWS)))
    const client = await createTestClient(register)

    const result = await client.callTool({ name: 'get_shows', arguments: {} })
    const shows = parseResult(result) as typeof SHOWS

    expect(shows).toHaveLength(2)
    expect(shows[0]).toEqual({ id: 1, name: 'Morning Drive', description: 'Wake up with us', genre: 'Pop', url: '/shows/1' })
    expect(shows[0]).not.toHaveProperty('extra_field')
  })
})
