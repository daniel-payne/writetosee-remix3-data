import type { Middleware } from 'remix/fetch-router'
import { Database } from 'remix/data-table'
import { studentTable } from '@/data/schema'

export class StudentId {
  constructor(public id: number) {}
}

function parseCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

export function requireClass(): Middleware {
  return async (context, next) => {
    const db = context.get(Database)
    const cookieHeader = context.request.headers.get('Cookie')
    const classCode = parseCookieValue(cookieHeader, 'class')

    if (!classCode) {
      return new Response('Forbidden: No class code', { status: 403 })
    }

    const student = await db.findOne(studentTable, { where: { classCode } })

    if (!student) {
      return new Response('Forbidden: Invalid class code', { status: 403 })
    }

    context.set(StudentId, new StudentId(student.studentId))
    return next()
  }
}
