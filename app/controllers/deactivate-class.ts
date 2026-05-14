import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'
import { Database } from 'remix/data-table'
import { lessonTable, studentTable } from '@/data/schema'
import { requireSession, TutorId } from '@/middleware/requireSession'
import { coordinateStudents } from '@/processes/coordinateStudents'
import { formatData } from '@/utils/formatData'

export const deactivateClass: BuildAction<'POST', typeof routes.deactivateClass> = {
  middleware: [requireSession()],
  async handler({ request, get }: any) {
    const db = get(Database)
    const tutorId = get(TutorId).id

    let body: any
    try {
      body = await request.json()
    } catch {
      return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
    }

    const { lessonCode } = body
    if (!lessonCode) {
      return Response.json({ success: false, error: 'Missing lessonCode' }, { status: 400 })
    }

    const lesson = await db.findOne(lessonTable, { where: { lessonCode, tutorId } })
    if (!lesson) {
      return Response.json({ success: false, error: 'Lesson not found' }, { status: 404 })
    }

    await db.update(lessonTable, lesson.lessonId, { isActive: 0 })

    // Ensure students are coordinated (sets classCode, etc.)
    const parsedData = typeof lesson.data === 'string' ? JSON.parse(lesson.data) : (lesson.data ?? {})
    const studentNames = Array.isArray(parsedData.studentNames) ? parsedData.studentNames : []
    await coordinateStudents(db, lesson.lessonCode, studentNames)

    const updatedLesson = await db.findOne(lessonTable, { where: { lessonId: lesson.lessonId } })
    const students = await db.findMany(studentTable, { where: { lessonId: lesson.lessonId } })

    return Response.json({
      success: true,
      message: 'Class deactivated',
      data: formatData({ ...updatedLesson, students })
    })
  }
}
