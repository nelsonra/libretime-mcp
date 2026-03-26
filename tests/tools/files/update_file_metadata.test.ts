import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register } from '../../../src/tools/files/update_file_metadata.js'
import { createTestClient, jsonResponse } from '../../helpers.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('update_file_metadata', () => {
  it('sends only the provided fields in the PATCH body', async () => {
    const updated = { id: 1, name: 'track.mp3', track_title: 'New Title', artist_name: 'Original Artist', album_title: null, genre: null, length: null, mime: 'audio/mpeg', import_status: 1, created_at: null, last_played_at: null }
    const mockFetch = vi.fn().mockResolvedValue(jsonResponse(updated))
    vi.stubGlobal('fetch', mockFetch)
    const client = await createTestClient(register)

    await client.callTool({
      name: 'update_file_metadata',
      arguments: { file_id: 1, track_title: 'New Title' },
    })

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(sentBody).toEqual({ track_title: 'New Title' })
    expect(sentBody).not.toHaveProperty('artist_name')
  })
})
