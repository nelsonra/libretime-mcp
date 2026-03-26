import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register } from '../../../src/tools/files/search_files.js'
import { createTestClient, parseResult, jsonResponse } from '../../helpers.js'

const FILES = [
  { id: 1, name: 'track.mp3', track_title: 'City Rain', artist_name: 'Echo', album_title: 'Reflections', genre: 'Ambient', length: '00:03:30', mime: 'audio/mpeg', import_status: 1, created_at: '2024-01-01', last_played_at: '2024-06-01', hidden_field: 'strip me' },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('search_files', () => {
  it('returns trimmed file fields', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(FILES)))
    const client = await createTestClient(register)

    const result = await client.callTool({ name: 'search_files', arguments: {} })
    const files = parseResult(result) as Array<Record<string, unknown>>

    expect(files[0]).not.toHaveProperty('hidden_field')
    expect(files[0]).toMatchObject({ id: 1, name: 'track.mp3', artist_name: 'Echo' })
  })

  it('passes genre filter to the API', async () => {
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(FILES))
    vi.stubGlobal('fetch', mockFetch)
    const client = await createTestClient(register)

    await client.callTool({ name: 'search_files', arguments: { genre: 'Ambient' } })

    const calledUrl = new URL(mockFetch.mock.calls[0][0] as string)
    expect(calledUrl.searchParams.get('genre')).toBe('Ambient')
  })
})
