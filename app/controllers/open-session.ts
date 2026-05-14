import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'
import { Database } from 'remix/data-table'
import { tutorTable } from '@/data/schema'
import * as s from 'remix/data-schema'
import { authCookie } from '@/utils/authCookie'

const loginSchema = s.object({
  email: s.string(),
  password: s.string(),
})

export const openSession: BuildAction<'POST', typeof routes.openSession> = {
  async handler({ request, get }) {
    let body: any
    try {
      body = await request.json()
    } catch {
      return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = s.parseSafe(loginSchema, body)
    if (!parsed.success) {
      return Response.json({ success: false, error: 'Invalid input', issues: parsed.issues }, { status: 400 })
    }

    const { email, password } = parsed.value
    const db = get(Database)

    const tutor = await db.findOne(tutorTable, { where: { email } })
    if (!tutor) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const isMatch = await Bun.password.verify(password, tutor.passwordHash)
    if (!isMatch) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const sessionCode = crypto.randomUUID()
    try {
      await db.update(tutorTable, tutor.tutorId, {
        sessionCode,
      })
    } catch (err) {
      console.error(err)
      return Response.json({ success: false, error: 'Database error' }, { status: 500 })
    }

    const cookieHeader = await authCookie.serialize(sessionCode)

    return Response.json(
      { success: true, message: 'Session opened' },
      {
        headers: {
          'Set-Cookie': cookieHeader,
        },
      }
    )
  }
}
