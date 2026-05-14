import { describe, expect, test } from 'bun:test'
import { api, extractCookie } from '../helpers.ts'
import { readState, writeState } from '../state.ts'

describe('1. POST /add-tutor', () => {
  test('creates a tutor account', async () => {
    const { email, password } = readState()
    const { res, body } = await api('/add-tutor', {
      method: 'POST',
      body: { email, password, organizationName: 'ETL Online' },
    })
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data?.tutorCode).toBeTruthy()
    writeState({ tutorCode: body.data.tutorCode })
  })
})
