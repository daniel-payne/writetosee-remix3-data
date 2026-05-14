import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'
import { Database } from 'remix/data-table'
import { tutorTable, lessonTable, studentTable } from '@/data/schema'
import { requireSession, TutorId } from '@/middleware/requireSession'
import { formatData } from '@/utils/formatData'

export const retrieveLessons: BuildAction<'GET', typeof routes.retrieveLessons> = {
  middleware: [requireSession()],
  async handler({ get }: any) {
    const db = get(Database)
    const tutorId = get(TutorId).id

    const tutor = await db.findOne(tutorTable, { where: { tutorId } })
    if (!tutor) {
      return Response.json({ success: false, error: 'Tutor not found' }, { status: 404 })
    }

    const lessons = await db.findMany(lessonTable, { where: { tutorId } })
    const students = await db.findMany(studentTable, { where: { tutorId } })

    // Group students by lessonId
    const studentsByLesson: Record<number, any[]> = {}
    students.forEach((s: any) => {
      if (!studentsByLesson[s.lessonId]) studentsByLesson[s.lessonId] = []
      studentsByLesson[s.lessonId].push(s)
    })

    // Build the full data structure and format it recursively once
    const responseData = formatData({
      tutor,
      lessons: lessons.map((l: any) => ({
        ...l,
        students: studentsByLesson[l.lessonId] || []
      }))
    }, ['passwordHash'])

    return Response.json({
      success: true,
      ...responseData
    })
  }
}

