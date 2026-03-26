import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register } from '../../../src/tools/analytics/get_playout_history.js'
import { createTestClient, parseResult, jsonResponse } from '../../helpers.js'

const HISTORY = [
  { id: 100, starts: '2024-06-01T08:00:00Z', ends: '2024-06-01T08:04:00Z', file: 1, instance: 5 },
  { id: 101, starts: '2024-06-01T08:04:00Z', ends: '2024-06-01T08:07:00Z', file: 2, instance: 5 },
  { id: 102, starts: '2024-06-01T08:07:00Z', ends: null,                   file: null, instance: 5 },
]

const FILE_1 = { id: 1, track_title: 'Sunset Boulevard', artist_name: 'The Waves', album_title: 'Ocean', genre: 'Chill', length: '00:04:00' }
const FILE_2 = { id: 2, track_title: 'City Lights', artist_name: 'Urban Echo', album_title: null, genre: 'Electronic', length: '00:03:00' }

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('get_playout_history', () => {
  it('enriches history entries with file metadata', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse(HISTORY))
      .mockResolvedValueOnce(jsonResponse(FILE_1))
      .mockResolvedValueOnce(jsonResponse(FILE_2))
    )
    const client = await createTestClient(register)

    const result = await client.callTool({ name: 'get_playout_history', arguments: {} })
    const history = parseResult(result) as Array<{ track_title: string | null; artist_name: string | null }>

    expect(history[0].track_title).toBe('Sunset Boulevard')
    expect(history[0].artist_name).toBe('The Waves')
    expect(history[1].track_title).toBe('City Lights')
  })

  it('sets metadata fields to null when file is null', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse(HISTORY))
      .mockResolvedValueOnce(jsonResponse(FILE_1))
      .mockResolvedValueOnce(jsonResponse(FILE_2))
    )
    const client = await createTestClient(register)

    const result = await client.callTool({ name: 'get_playout_history', arguments: {} })
    const history = parseResult(result) as Array<{ track_title: string | null }>

    expect(history[2].track_title).toBeNull()
  })

  it('passes time range params to the LibreTime API', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce(jsonResponse([]))
    vi.stubGlobal('fetch', mockFetch)
    const client = await createTestClient(register)

    await client.callTool({
      name: 'get_playout_history',
      arguments: { starts: '2024-06-01T00:00:00Z', ends: '2024-06-01T23:59:59Z' },
    })

    const calledUrl = new URL(mockFetch.mock.calls[0][0] as string)
    expect(calledUrl.searchParams.get('starts')).toBe('2024-06-01T00:00:00Z')
    expect(calledUrl.searchParams.get('ends')).toBe('2024-06-01T23:59:59Z')
  })

  it('deduplicates file fetches when the same file appears multiple times', async () => {
    const historyWithDupe = [
      { id: 100, starts: '2024-06-01T08:00:00Z', ends: '2024-06-01T08:04:00Z', file: 1, instance: 5 },
      { id: 101, starts: '2024-06-01T08:04:00Z', ends: '2024-06-01T08:08:00Z', file: 1, instance: 5 },
    ]
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse(historyWithDupe))
      .mockResolvedValueOnce(jsonResponse(FILE_1))
    vi.stubGlobal('fetch', mockFetch)
    const client = await createTestClient(register)

    await client.callTool({ name: 'get_playout_history', arguments: {} })

    // playout-history (1) + one unique file fetch (1) = 2 total
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
