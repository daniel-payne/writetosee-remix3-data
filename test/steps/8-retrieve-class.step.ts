import { describe, expect, test } from 'bun:test'
import { api } from '../helpers.ts'
import { readState } from '../state.ts'

describe('8. GET /retrieve-class', () => {
  test('returns student, parent lesson, manuscripts and panels', async () => {
    const { classCookie, lessonCode } = readState()

    const { res, body } = await api('/retrieve-class', {
      cookies: { class: classCookie },
    })

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    expect(body.data?.studentCode).toBeTruthy()
    expect(body.data?.lesson?.lessonCode).toBe(lessonCode)

    expect(Array.isArray(body.data?.manuscripts)).toBe(true)
  })
})
