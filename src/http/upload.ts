import cors from 'cors'
import type { Express } from 'express'

/**
 * Registers POST /upload on the given Express app.
 *
 * The React UI posts audio files here directly (bypassing the MCP protocol).
 * The body is buffered in memory before forwarding to LibreTime.
 *
 * TODO: switch back to streaming (Readable.toWeb) for large show files once
 * the basic flow is confirmed working end-to-end.
 *
 * Auth: X-Upload-Token header must match the provided uploadToken.
 *
 * Returns the full upload URL so callers can pass it to registerFiles().
 */
export function registerUploadEndpoint(app: Express, publicUrl: string, uploadToken: string): string {
  // Explicit CORS for the upload route — must allow X-Upload-Token so the
  // browser's preflight passes before sending the actual file.
  const uploadCors = cors({
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-Upload-Token'],
  })
  app.options('/upload', uploadCors)
  app.post('/upload', uploadCors, async (req, res) => {
    const token = req.headers['x-upload-token']
    if (!token || token !== uploadToken) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const BASE_URL = process.env.LIBRETIME_URL ?? ''
    const USER = process.env.LIBRETIME_USER ?? ''
    const PASS = process.env.LIBRETIME_PASS ?? ''
    const libreAuth = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64')
    const libreUrl = new URL('/api/v2/files', BASE_URL).toString()

    try {
      console.error('[upload] buffering request body...')
      const body = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', () => resolve(Buffer.concat(chunks)))
        req.on('error', reject)
      })
      console.error(`[upload] body buffered: ${body.length} bytes`)

      console.error(`[upload] forwarding to LibreTime: ${libreUrl}`)
      const response = await fetch(libreUrl, {
        method: 'POST',
        headers: {
          Authorization: libreAuth,
          Accept: 'application/json',
          'Content-Type': req.headers['content-type'] as string,
          'Content-Length': String(body.length),
        },
        body: new Uint8Array(body),
      })
      console.error(`[upload] LibreTime responded: ${response.status}`)

      if (!response.ok) {
        const detail = await response.text()
        console.error(`[upload] LibreTime error detail: ${detail}`)
        res.status(502).json({ error: `LibreTime error: ${response.status}`, detail })
        return
      }

      res.json(await response.json())
    } catch (err) {
      console.error('[upload] caught error:', err)
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
    }
  })

  return `${publicUrl}/upload`
}
