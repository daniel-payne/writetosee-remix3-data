/**
 * Shared HTTP helper.
 * 
 * Set TEST_BASE_URL to override the default server address.
 */

export const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:44100'

/** Extract the value of a named cookie from a Set-Cookie header string */
export function extractCookie(header: string | null, name: string): string | null {
  if (!header) return null
  for (const part of header.split(/,(?=[^ ])/)) {
    const [pair] = part.trim().split(';')
    const [k, v] = pair.split('=')
    if (k.trim() === name) return v?.trim() ?? null
  }
  return null
}

/** Build a Cookie header string from a name→value map */
export function cookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

/** Fetch a path on the test server, returning the Response and parsed JSON body */
export async function api(
  path: string,
  options: { method?: string; body?: unknown; cookies?: Record<string, string> } = {}
): Promise<{ res: Response; body: any }> {
  const { method = 'GET', body, cookies = {} } = options
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (Object.keys(cookies).length) headers['Cookie'] = cookieHeader(cookies)

  const res = await globalThis.fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let json: any
  try { json = await res.json() } catch { json = null }
  return { res, body: json }
}
