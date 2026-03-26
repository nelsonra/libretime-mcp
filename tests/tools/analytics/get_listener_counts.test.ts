import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register } from '../../../src/tools/analytics/get_listener_counts.js'
import { createTestClient, parseResult, jsonResponse } from '../../helpers.js'

const LISTENER_COUNTS = [
  { id: 1, listener_count: 42, timestamp: 1717200000, mount_name: 10 },
  { id: 2, listener_count: 15, timestamp: 1717200060, mount_name: 11 },
  { id: 3, listener_count: 5,  timestamp: 1717200120, mount_name: 99 }, // unknown mount
]

const MOUNT_NAMES = [
  { id: 10, mount_name: '/stream/mp3' },
  { id: 11, mount_name: '/stream/aac' },
]

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('get_listener_counts', () => {
  it('joins listener counts with mount names', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse(LISTENER_COUNTS))
      .mockResolvedValueOnce(jsonResponse(MOUNT_NAMES))
    )
    const client = await createTestClient(register)

    const result = await client.callTool({ name: 'get_listener_counts', arguments: {} })
    const counts = parseResult(result) as Array<{ id: number; listener_count: number; mount: string }>

    expect(counts[0].mount).toBe('/stream/mp3')
    expect(counts[1].mount).toBe('/stream/aac')
  })

  it('falls back to "mount_<id>" when mount name is not found', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(jsonResponse(LISTENER_COUNTS))
      .mockResolvedValueOnce(jsonResponse(MOUNT_NAMES))
    )
    const client = await createTestClient(register)

    const result = await client.callTool({ name: 'get_listener_counts', arguments: {} })
    const counts = parseResult(result) as Array<{ mount: string }>

    expect(counts[2].mount).toBe('mount_99')
  })
})
