import { column as c, table } from 'remix/data-table'
import type { TableRow } from 'remix/data-table'

export const tutorTable = table({
  name: 'tutor',
  primaryKey: 'tutorId',
  columns: {
    tutorId:      c.integer().primaryKey(),
    tutorCode:    c.text().notNull().default(''),
    sessionCode:  c.text(),
    data:         c.text().notNull().default('{}'),
    email:        c.text().notNull(),
    passwordHash: c.text().notNull(),
    isActive:     c.integer().notNull().default(1),
    updatedAt:  c.text().notNull().default(''), // TIMESTAMP
  },
})

export type Tutor = TableRow<typeof tutorTable>


export const lessonTable = table({
  name: 'lesson',
  primaryKey: 'lessonId',
  columns: {
    lessonId:   c.integer().primaryKey(),
    lessonCode: c.text().notNull().default(''),
    tutorId:    c.integer().notNull(),
    data:       c.text().notNull().default('{}'),
    isActive:   c.integer().notNull().default(1),
    updatedAt: c.text().notNull().default(''), // TIMESTAMP
  },
})

export type Lesson = TableRow<typeof lessonTable>

export const studentTable = table({
  name: 'student',
  primaryKey: 'studentId',
  columns: {
    studentId:   c.integer().primaryKey(),
    studentCode: c.text(),
    classCode:   c.text(),
    tutorId:     c.integer().notNull(),
    lessonId:    c.integer().notNull(),
    manuscript:  c.text(),
    data:        c.text().notNull().default('{}'),
    isActive:    c.integer().notNull().default(1),
    updatedAt:  c.text().notNull().default(''), // TIMESTAMP
  },
})

export type Student = TableRow<typeof studentTable>

export const manuscriptTable = table({
  name: 'manuscript',
  primaryKey: 'manuscriptId',
  columns: {
    manuscriptId: c.integer().primaryKey(),
    studentId:    c.integer().notNull(),
    manuscript:   c.text(),
  },
})

export type Manuscript = TableRow<typeof manuscriptTable>

export const panelTable = table({
  name: 'panel',
  primaryKey: 'panelId',
  columns: {
    panelId:      c.integer().primaryKey(),
    manuscriptId: c.integer().notNull(),
    panelNo:      c.integer().notNull(),
    data:         c.text().notNull().default('{}'),
    isActive:     c.integer().notNull().default(1),
    updatedAt:    c.text().notNull().default(''), // TIMESTAMP
  },
})

export type Panel = TableRow<typeof panelTable>

