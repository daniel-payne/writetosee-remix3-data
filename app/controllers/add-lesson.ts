import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'
import { Database } from 'remix/data-table'
import { lessonTable } from '@/data/schema'
import { requireSession, TutorId } from '@/middleware/requireSession'
import lessonDefaults from '@/defaults/lesson.json'
import { coordinateStudents } from '@/processes/coordinateStudents'

import { formatData } from '@/utils/formatData'

export const addLesson: BuildAction<'POST', typeof routes.addLesson> = {
  middleware: [requireSession()],
  async handler({ get }) {
    const db = get(Database)
    const tutorId = get(TutorId).id

    let lesson: any
    try {
      const result = await db.create(lessonTable, {
        tutorId,
        data: JSON.stringify(lessonDefaults),
      })
      if (result && typeof result.insertId === 'number') {
        lesson = await db.findOne(lessonTable, { where: { lessonId: result.insertId } })
      } else {
        lesson = result
      }
    } catch (err: any) {
      console.error(err)
      return Response.json({ success: false, error: 'Database error', message: err.message }, { status: 500 })
    }

    try {
      const parsedData = typeof lesson.data === 'string' ? JSON.parse(lesson.data) : (lesson.data ?? {})
      const studentNames = Array.isArray(parsedData.studentNames) ? parsedData.studentNames : []
      await coordinateStudents(db, lesson.lessonCode, studentNames)
    } catch (err: any) {
      console.error('Coordinate students error:', err)
      // Non-fatal, we can still return success for the lesson creation, or handle as needed
    }

    return Response.json({
      success: true,
      message: 'Lesson added',
      data: formatData(lesson)
    })
  }
}
