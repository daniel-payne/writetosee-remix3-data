import { describe, expect, test } from 'bun:test'
import { api } from '../helpers.ts'
import { readState, writeState } from '../state.ts'

describe('4. POST /add-lesson', () => {
  test('creates a lesson', async () => {
    const { sessionCookie } = readState()

    const { res, body } = await api('/add-lesson', {
      method: 'POST',
      cookies: { session: sessionCookie },
    })

    expect(res.status).toBe(200)

    expect(body.success).toBe(true)
    expect(body.data?.lessonCode).toBeTruthy()

    writeState({ lessonCode: body.data.lessonCode })
  })
})
