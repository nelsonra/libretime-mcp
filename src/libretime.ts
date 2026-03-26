const BASE_URL = process.env.LIBRETIME_URL ?? ''
const USER = process.env.LIBRETIME_USER ?? ''
const PASS = process.env.LIBRETIME_PASS ?? ''

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
 * Make an authenticated multipart POST request to the LibreTime API.
 * Used for file uploads. Returns the parsed JSON response as unknown.
 */
export async function libreUpload(path: string, formData: FormData): Promise<unknown> {
  const url = new URL(path, BASE_URL)

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
      // Note: do NOT set Content-Type here — fetch sets it automatically
      // with the correct multipart boundary when given a FormData body
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`LibreTime API error: ${response.status} ${response.statusText} — ${url.toString()}`)
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
