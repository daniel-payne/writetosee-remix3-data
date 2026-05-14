import { describe, expect, test } from 'bun:test'
import { api, extractCookie } from '../helpers.ts'
import { readState, writeState } from '../state.ts'

describe('2. POST /open-session', () => {
  test('returns a session cookie', async () => {
    const { email, password } = readState()
    const { res, body } = await api('/open-session', {
      method: 'POST',
      body: { email, password },
    })
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    const value = extractCookie(res.headers.get('Set-Cookie'), 'session')
    expect(value).toBeTruthy()
    writeState({ sessionCookie: value! })
  })
})
