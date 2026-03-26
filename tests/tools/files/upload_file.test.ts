import { describe, it, expect, vi, beforeEach } from 'vitest'
import { register } from '../../../src/tools/files/upload_file.js'
import { createTestClient, parseResult, jsonResponse, blobResponse } from '../../helpers.js'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('upload_file', () => {
  it('returns upload_required signal when no URL is provided', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const client = await createTestClient(register)

    const result = await client.callTool({ name: 'upload_file', arguments: {} })
    const body = parseResult(result) as { status: string; action: string }

    expect(body.status).toBe('upload_required')
    expect(body.action).toBe('file_upload')
  })

  it('fetches the file from URL then uploads to LibreTime', async () => {
    const uploadedFile = { id: 99, name: 'song.mp3', track_title: 'Test Song', artist_name: null, album_title: null, genre: null, length: null, mime: 'audio/mpeg', import_status: 1, created_at: null, last_played_at: null }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(blobResponse())
      .mockResolvedValueOnce(jsonResponse(uploadedFile))
    )
    const client = await createTestClient(register)

    const result = await client.callTool({
      name: 'upload_file',
      arguments: { url: 'https://example.com/song.mp3', track_title: 'Test Song' },
    })
    const body = parseResult(result) as { status: string; file: typeof uploadedFile }

    expect(body.status).toBe('success')
    expect(body.file.id).toBe(99)
  })

  it('returns an error when the file URL is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' }))
    const client = await createTestClient(register)

    const result = await client.callTool({
      name: 'upload_file',
      arguments: { url: 'https://example.com/missing.mp3' },
    })
    const body = parseResult(result) as { status: string; reason: string }

    expect(body.status).toBe('error')
    expect(body.reason).toContain('404')
  })
})
