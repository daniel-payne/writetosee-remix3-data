import { describe, expect, test } from 'bun:test'
import { api } from '../helpers.ts'
import { readState, writeState } from '../state.ts'

describe('7. POST /activate-class', () => {
  test('activates lesson and sets classCode on students', async () => {
    const { sessionCookie, lessonCode } = readState()

    const { res, body } = await api('/activate-class', {
      method: 'POST',
      cookies: { session: sessionCookie },
      body: { lessonCode },
    })

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    const first = body.data.students[0]

    expect(body.data?.isActive).toBe(1)
    expect(Array.isArray(body.data?.students)).toBe(true)
    expect(first?.classCode).toBeTruthy()
    writeState({ classCookie: first.classCode })
  })
})
