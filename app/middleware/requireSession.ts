import type { Middleware } from 'remix/fetch-router'
import { Database } from 'remix/data-table'
import { tutorTable } from '@/data/schema'
import { authCookie } from '@/utils/authCookie'

export class TutorId {
  constructor(public id: number) {}
}

export function requireSession(): Middleware {
  return async (context, next) => {
    const db = context.get(Database)
    const cookieHeader = context.request.headers.get('Cookie')
    const sessionCode = await authCookie.parse(cookieHeader)

    if (!sessionCode) {
      return new Response('Forbidden: No session code', { status: 403 })
    }

    const tutor = await db.findOne(tutorTable, { where: { sessionCode } })
    
    if (!tutor) {
      return new Response('Forbidden: Invalid session', { status: 403 })
    }

    context.set(TutorId, new TutorId(tutor.tutorId))
    return next()
  }
}
