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
    const totalStart = Date.now()

    const token = req.headers['x-upload-token']
    if (!token || token !== uploadToken) {
      console.error(`[upload] status=401 total_ms=${Date.now() - totalStart}`)
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const BASE_URL = process.env.LIBRETIME_URL ?? ''
    // /rest/media is the legacy PHP upload endpoint — the only path that writes
    // files to disk and queues the analyzer. Auth uses the LibreTime API key
    // (from config.yml general.api_key) as the Basic Auth username with no password.
    const API_KEY = process.env.LIBRETIME_API_KEY ?? ''
    const libreAuth = 'Basic ' + Buffer.from(`${API_KEY}:`).toString('base64')
    const libreUrl = new URL('/rest/media', BASE_URL).toString()

    try {
      const body = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', () => resolve(Buffer.concat(chunks)))
        req.on('error', reject)
      })

      const sizeMb = (body.length / 1024 / 1024).toFixed(2)

      const libreStart = Date.now()
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
      const libreMs = Date.now() - libreStart
      const totalMs = Date.now() - totalStart

      if (!response.ok) {
        const detail = await response.text()
        console.error(`[upload] size=${sizeMb}mb libretime_ms=${libreMs} total_ms=${totalMs} status=${response.status} error="${detail}"`)
        res.status(502).json({ error: `LibreTime error: ${response.status}`, detail })
        return
      }

      console.error(`[upload] size=${sizeMb}mb libretime_ms=${libreMs} total_ms=${totalMs} status=${response.status}`)
      res.json(await response.json())
    } catch (err) {
      console.error(`[upload] total_ms=${Date.now() - totalStart} status=500 error="${err instanceof Error ? err.message : String(err)}"`)
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) })
    }
  })

  return `${publicUrl}/upload`
}
