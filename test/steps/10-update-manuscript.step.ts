import { describe, expect, test } from 'bun:test'
import { api } from '../helpers.ts'
import { readState } from '../state.ts'

describe('10. POST /update-manuscript', () => {
  test('updates the manuscript text', async () => {
    const { classCookie, manuscriptCode } = readState()
    const sampleText = 'The cat sat on the mat, beside the fireplace. The storm raged outside.'

    const { res, body } = await api('/update-manuscript', {
      method: 'POST',
      cookies: { class: classCookie },
      body: { manuscriptCode, text: sampleText },
    })

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data?.manuscriptCode).toBe(manuscriptCode)
    expect(body.data?.text).toBe(sampleText)
  })
})
