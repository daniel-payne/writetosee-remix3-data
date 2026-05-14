import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'
import { Database } from 'remix/data-table'
import { tutorTable } from '@/data/schema'
import * as s from 'remix/data-schema'
import { minLength } from 'remix/data-schema/checks'

const incomingSchema = s.object({
  email: s.string(),
  password: s.string().pipe(minLength(5)),
})

import { formatData } from '@/utils/formatData'

export const addTutor: BuildAction<'POST', typeof routes.addTutor> = {
  async handler({ request, get }) {
    let body: any
    try {
      body = await request.json()
    } catch {
      return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = s.parseSafe(incomingSchema, body)
    if (!parsed.success) {
      return Response.json({ success: false, error: 'Invalid schema', issues: parsed.issues }, { status: 400 })
    }

    if (!/\d/.test(parsed.value.password)) {
      return Response.json({ success: false, error: 'passwordHash must include a number' }, { status: 400 })
    }

    const { email, password, ...rest } = body
    const db = get(Database)

    const passwordHash = await Bun.password.hash(password)

    const existingTutor = await db.findOne(tutorTable, { where: { email } })
    if (existingTutor) {
      return Response.json({ success: false, error: 'Tutor already exists' }, { status: 400 })
    }

    let tutor: any
    try {
      const result = await db.create(tutorTable, {
        email,
        passwordHash,
        data: JSON.stringify(rest),
      })
      // If result has insertId, it's metadata, fetch the actual row
      if (result && typeof result.insertId === 'number') {
        tutor = await db.findOne(tutorTable, { where: { tutorId: result.insertId } })
      } else {
        tutor = result
      }
    } catch (err: any) {
      console.error(err)
      return Response.json({ success: false, error: 'Database error', message: err.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: 'Tutor added',
      data: formatData(tutor, ['passwordHash'])
    })
  }
}
