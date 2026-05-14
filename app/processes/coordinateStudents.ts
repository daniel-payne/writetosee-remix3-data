import { Database } from 'remix/data-table'
import { lessonTable, studentTable } from '@/data/schema'

export async function coordinateStudents(db: Database, lessonCode: string, studentNames: string[]) {
  const lesson = await db.findOne(lessonTable, { where: { lessonCode } })
  if (!lesson) {
    throw new Error(`Lesson not found: ${lessonCode}`)
  }

  const existingStudents = await db.findMany(studentTable, { where: { lessonId: lesson.lessonId } })

  const existingMap = new Map()
  for (const student of existingStudents) {
    const data = typeof student.data === 'string' ? JSON.parse(student.data) : (student.data ?? {})
    if (data.name) {
      existingMap.set(data.name, student)
    }
  }

  const currentNamesSet = new Set(studentNames)

  // Add new students or reactivate existing ones
  for (const name of studentNames) {
    if (existingMap.has(name)) {
      const student = existingMap.get(name)
      if (student.isActive === 0 || student.classCode !== lesson.lessonCode) {
        await db.update(studentTable, student.studentId, { 
          isActive: 1,
          classCode: lesson.lessonCode
        })
      }
    } else {
      await db.create(studentTable, {
        tutorId: lesson.tutorId,
        lessonId: lesson.lessonId,
        classCode: lesson.lessonCode,
        data: JSON.stringify({ name }),
        isActive: 1
      })
    }
  }

  // Deactivate missing students
  for (const student of existingStudents) {
    const data = typeof student.data === 'string' ? JSON.parse(student.data) : (student.data ?? {})
    if (data.name && !currentNamesSet.has(data.name)) {
      if (student.isActive !== 0) {
        await db.update(studentTable, student.studentId, { isActive: 0 })
      }
    }
  }
}
