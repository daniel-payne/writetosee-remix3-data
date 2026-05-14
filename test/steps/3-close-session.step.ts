import { describe, expect, test } from 'bun:test'
import { api, extractCookie } from '../helpers.ts'
import { readState, writeState } from '../state.ts'

describe('3. POST /close-session', () => {
  test('clears the session then reopens it', async () => {
    const { email, password, sessionCookie } = readState()

    const { res, body } = await api('/close-session', {
      method: 'POST',
      cookies: { session: sessionCookie },
    })
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    // Reopen session so subsequent steps have a valid cookie
    const reopen = await api('/open-session', {
      method: 'POST',
      body: { email, password },
    })

    const newSession = extractCookie(reopen.res.headers.get('Set-Cookie'), 'session')

    expect(newSession).toBeTruthy()

    writeState({ sessionCookie: newSession! })
  })
})
