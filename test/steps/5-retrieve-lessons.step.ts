import { describe, expect, test } from 'bun:test'
import { api } from '../helpers.ts'
import { readState } from '../state.ts'

describe('5. GET /retrieve-lessons', () => {
  test('returns lessons and hides sensitive fields', async () => {
    const { sessionCookie } = readState()
    const { res, body } = await api('/retrieve-lessons', {
      cookies: { session: sessionCookie },
    })
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.lessons)).toBe(true)
    expect(body.lessons.length).toBeGreaterThan(0)
    expect(body.tutor?.passwordHash).toBeUndefined()
    expect(body.tutor?.sessionCode).toBeUndefined()
  })
})
