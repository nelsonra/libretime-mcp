import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register } from '../../../src/tools/shows/get_stream_state.js'
import { createTestClient, parseResult, jsonResponse } from '../../helpers.js'

const STREAM_STATE = {
  input_main_connected: false,
  input_main_streaming: false,
  input_show_connected: true,
  input_show_streaming: true,
  schedule_streaming: true,
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('get_stream_state', () => {
  it('returns the stream state from LibreTime', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(STREAM_STATE)))
    const client = await createTestClient(register)

    const result = await client.callTool({ name: 'get_stream_state', arguments: {} })
    const state = parseResult(result) as typeof STREAM_STATE

    expect(state.input_show_connected).toBe(true)
    expect(state.schedule_streaming).toBe(true)
  })
})
