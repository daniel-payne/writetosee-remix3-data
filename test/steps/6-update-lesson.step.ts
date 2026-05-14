import { describe, expect, test } from 'bun:test'
import { api } from '../helpers.ts'
import { readState } from '../state.ts'

describe('6. POST /update-lesson', () => {
  test('updates lesson and returns 4 students', async () => {
    const { sessionCookie, lessonCode } = readState()

    const { res, body } = await api('/update-lesson', {
      method: 'POST',
      cookies: { session: sessionCookie },
      body: {
        lessonCode,
        studentNames: 'paul, dave, bill, fred',
      },
    })

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    expect(Array.isArray(body.data?.students)).toBe(true)

    expect(body.data.students.length).toBe(4)
  })
})
