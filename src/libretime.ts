const BASE_URL = process.env.LIBRETIME_URL ?? ''
const USER = process.env.LIBRETIME_USER ?? ''
const PASS = process.env.LIBRETIME_PASS ?? ''
const API_KEY = process.env.LIBRETIME_API_KEY ?? ''

// Basic Auth header value, base64-encoded as the HTTP spec requires
const authHeader = 'Basic ' + Buffer.from(`${USER}:${PASS}`).toString('base64')

/**
 * Make an authenticated GET request to the LibreTime API.
 * Returns the parsed JSON response as unknown — callers are responsible for validation.
 */
export async function libreGet(path: string, params?: Record<string, string>): Promise<unknown> {
  const url = new URL(path, BASE_URL)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`LibreTime API error: ${response.status} ${response.statusText} — ${url.toString()}`)
  }

  return response.json()
}

/**
 * Make an authenticated POST request to the LibreTime API with a JSON body.
 * Returns the parsed JSON response as unknown — callers are responsible for validation.
 */
export async function librePost(path: string, body: Record<string, unknown>): Promise<unknown> {
  const url = new URL(path, BASE_URL)

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`LibreTime API error: ${response.status} ${response.statusText} — ${url.toString()}`)
  }

  return response.json()
}

/**
 * BENCHED: multipart POST to /api/v2/files (DRF).
 * Creates a DB record but never writes to disk or queues the analyzer —
 * filepath stays null and import_status stays 1 forever.
 * Kept here for when the DRF endpoint gets the analyzer wiring fixed upstream.
 * See: PLAN.md → Open source contributions → LibreTime file upload
 */
export async function libreUpload(path: string, formData: FormData): Promise<unknown> {
  const url = new URL(path, BASE_URL)

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`LibreTime API error: ${response.status} ${response.statusText} — ${url.toString()}`)
  }

  return response.json()
}

/**
 * Upload a file to /rest/media — the legacy PHP endpoint that triggers the full
 * import workflow (writes to disk, queues the analyzer). The DRF /api/v2/files
 * endpoint creates a DB record but never writes to disk, so this is the only
 * working upload path.
 *
 * Auth uses LIBRETIME_API_KEY (general.api_key from LibreTime config.yml) as
 * Basic Auth username with no password, which is what /rest/media expects.
 */
export async function libreRestMedia(formData: FormData): Promise<unknown> {
  const url = new URL('/rest/media', BASE_URL)
  const apiKeyAuth = 'Basic ' + Buffer.from(`${API_KEY}:`).toString('base64')

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: apiKeyAuth,
      Accept: 'application/json',
      // Do NOT set Content-Type — fetch sets it with the correct multipart boundary
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`LibreTime upload error: ${response.status} ${response.statusText} — ${url.toString()}`)
  }

  return response.json()
}

/**
 * Make an authenticated PATCH request to the LibreTime API with a JSON body.
 * Returns the parsed JSON response as unknown — callers are responsible for validation.
 */
export async function librePatch(path: string, body: Record<string, unknown>): Promise<unknown> {
  const url = new URL(path, BASE_URL)

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`LibreTime API error: ${response.status} ${response.statusText} — ${url.toString()}`)
  }

  return response.json()
}

/**
 * Make an authenticated DELETE request to the LibreTime API.
 */
export async function libreDelete(path: string): Promise<void> {
  const url = new URL(path, BASE_URL)

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      Authorization: authHeader,
    },
  })

  if (!response.ok) {
    throw new Error(`LibreTime API error: ${response.status} ${response.statusText} — ${url.toString()}`)
  }
}
