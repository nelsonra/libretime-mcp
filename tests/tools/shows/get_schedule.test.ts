import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register } from '../../../src/tools/shows/get_schedule.js'
import { createTestClient, parseResult, jsonResponse } from '../../helpers.js'

const SCHEDULE = [
  { id: 10, starts: '2024-06-01T06:00:00Z', ends: '2024-06-01T09:00:00Z', show_id: 1, show_name: 'Morning Drive', broadcasted: 1 },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('get_schedule', () => {
  it('passes date range params to the LibreTime API', async () => {
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(SCHEDULE))
    vi.stubGlobal('fetch', mockFetch)
    const client = await createTestClient(register)

    await client.callTool({
      name: 'get_schedule',
      arguments: { starts_after: '2024-06-01T00:00:00Z', starts_before: '2024-06-02T00:00:00Z' },
    })

    const calledUrl = new URL(mockFetch.mock.calls[0][0] as string)
    expect(calledUrl.searchParams.get('starts_after')).toBe('2024-06-01T00:00:00Z')
    expect(calledUrl.searchParams.get('starts_before')).toBe('2024-06-02T00:00:00Z')
  })

  it('returns schedule items as-is', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(SCHEDULE)))
    const client = await createTestClient(register)

    const result = await client.callTool({
      name: 'get_schedule',
      arguments: { starts_after: '2024-06-01T00:00:00Z', starts_before: '2024-06-02T00:00:00Z' },
    })
    const schedule = parseResult(result) as typeof SCHEDULE

    expect(schedule).toHaveLength(1)
    expect(schedule[0].show_name).toBe('Morning Drive')
  })
})
