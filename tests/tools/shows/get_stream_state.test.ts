import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register } from '../../../src/tools/shows/get_stream_state.js'
import { createTestClient, parseResult, jsonResponse } from '../../helpers.js'

const STREAM_STATE = { source_enabled: true, live: true, mount: '/live' }

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('get_stream_state', () => {
  it('returns the stream state from LibreTime', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(STREAM_STATE)))
    const client = await createTestClient(register)

    const result = await client.callTool({ name: 'get_stream_state', arguments: {} })
    const state = parseResult(result) as typeof STREAM_STATE

    expect(state.source_enabled).toBe(true)
    expect(state.mount).toBe('/live')
  })
})
