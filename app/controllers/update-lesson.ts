import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'
import { Database } from 'remix/data-table'
import { lessonTable, studentTable } from '@/data/schema'
import { requireSession, TutorId } from '@/middleware/requireSession'
import { coordinateStudents } from '@/processes/coordinateStudents'

import { formatData } from '@/utils/formatData'

export const updateLesson: BuildAction<'POST', typeof routes.updateLesson> = {
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

    const { lessonCode, ...updateData } = body
    if (!lessonCode) {
      return Response.json({ success: false, error: 'Missing lessonCode' }, { status: 400 })
    }

    const lesson = await db.findOne(lessonTable, { where: { lessonCode, tutorId } })
    if (!lesson) {
      return Response.json({ success: false, error: 'Lesson not found' }, { status: 404 })
    }

    if (typeof updateData.studentNames === 'string') {
      updateData.studentNames = updateData.studentNames.split(',').map((s: string) => s.trim()).filter(Boolean)
    }

    const currentData = typeof lesson.data === 'string' ? JSON.parse(lesson.data) : (lesson.data ?? {})
    const newData = { ...currentData, ...updateData }

    try {
      await db.update(lessonTable, lesson.lessonId, {
        data: JSON.stringify(newData)
      })
    } catch (err: any) {
      console.error(err)
      return Response.json({ success: false, error: 'Database error', message: err.message }, { status: 500 })
    }

    try {
      const studentNames = Array.isArray(newData.studentNames) ? newData.studentNames : []
      await coordinateStudents(db, lesson.lessonCode, studentNames)
    } catch (err: any) {
      console.error('Coordinate students error:', err)
    }

    // Return the updated lesson along with its students
    const updatedLesson = await db.findOne(lessonTable, { where: { lessonId: lesson.lessonId } })
    const students = await db.findMany(studentTable, { where: { lessonId: lesson.lessonId } })

    return Response.json({
      success: true,
      message: 'Lesson updated',
      data: formatData({ ...updatedLesson, students })
    })
  }
}
