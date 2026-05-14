import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'
import { Database } from 'remix/data-table'
import { lessonTable, manuscriptTable, panelTable, studentTable } from '@/data/schema'
import { requireClass, StudentId } from '@/middleware/requireClass'
import { formatData } from '@/utils/formatData'

export const retrieveClass: BuildAction<'GET', typeof routes.retrieveClass> = {
  middleware: [requireClass()],
  async handler({ get }: any) {
    const db = get(Database)
    const studentId = get(StudentId).id

    const student = await db.findOne(studentTable, { where: { studentId } })
    if (!student) {
      return Response.json({ success: false, error: 'Student not found' }, { status: 404 })
    }

    const lesson = await db.findOne(lessonTable, { where: { lessonId: student.lessonId } })
    if (!lesson) {
      return Response.json({ success: false, error: 'Lesson not found' }, { status: 404 })
    }

    const manuscripts = await db.findMany(manuscriptTable, { where: { studentId } })

    // Fetch panels for each manuscript
    const manuscriptsWithPanels = await Promise.all(
      manuscripts.map(async (m: any) => {
        const panels = await db.findMany(panelTable, { where: { manuscriptId: m.manuscriptId } })
        return { ...m, panels }
      })
    )

    return Response.json({
      success: true,
      data: formatData({
        ...student,
        lesson,
        manuscripts: manuscriptsWithPanels,
      })
    })
  }
}


