import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'
import { Database } from 'remix/data-table'
import { tutorTable } from '@/data/schema'
import { authCookie } from '@/utils/authCookie'

export const closeSession: BuildAction<'POST', typeof routes.closeSession> = {
  async handler({ request, get }) {
    const db = get(Database)
    const cookieHeader = request.headers.get('Cookie')
    const sessionCode = await authCookie.parse(cookieHeader)

    if (sessionCode) {
      const tutor = await db.findOne(tutorTable, { where: { sessionCode } })
      if (tutor) {
        await db.update(tutorTable, tutor.tutorId, { sessionCode: '' })
      }
    }

    return Response.json(
      { success: true, message: 'Session closed' },
      {
        headers: {
          'Set-Cookie': await authCookie.serialize('', { maxAge: 0 }),
        },
      }
    )
  }
}
