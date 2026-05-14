import { describe, expect, test } from 'bun:test'
import { api } from '../helpers.ts'
import { readState, writeState } from '../state.ts'

describe('9. POST /add-manuscript', () => {
  test('creates a manuscript for the authenticated student', async () => {
    const { classCookie } = readState()

    const { res, body } = await api('/add-manuscript', {
      method: 'POST',
      cookies: { class: classCookie },
    })

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data?.manuscriptCode).toBeTruthy()
    expect(body.data?.isActive).toBe(1)

    writeState({ manuscriptCode: body.data.manuscriptCode })
  })
})
