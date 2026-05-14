/**
 * Task: remove-user
 *
 * Removes a tutor and all their associated data from the database.
 * Cascade order: tutor → lesson → student → manuscript → panel
 *
 * Usage:
 *   bun tasks/remove-user.ts <email>
 *   DATABASE_PATH=./test.db bun tasks/remove-user.ts <email>
 *
 * Future: will also remove any image files created for this user.
 */

import { Database } from 'bun:sqlite'

const email = process.argv[2]

if (!email) {
  console.error('Usage: bun tasks/remove-user.ts <email>')
  process.exit(1)
}

const dbPath = process.env.DATABASE_PATH ?? './database.db'
const db = new Database(dbPath)
db.exec('PRAGMA foreign_keys = ON;')

try {
  const tutor = db.prepare('SELECT * FROM tutor WHERE email = ?').get(email) as any

  if (!tutor) {
    console.error(`❌  No user found with email: ${email}`)
    process.exit(1)
  }

  // Count associated data before deletion for the summary
  const lessonCount  = (db.prepare('SELECT COUNT(*) as n FROM lesson  WHERE tutorId = ?').get(tutor.tutorId) as any).n
  const studentCount = (db.prepare('SELECT COUNT(*) as n FROM student WHERE tutorId = ?').get(tutor.tutorId) as any).n
  const manuscriptCount = (db.prepare(`
    SELECT COUNT(*) as n FROM manuscript
    WHERE studentId IN (SELECT studentId FROM student WHERE tutorId = ?)
  `).get(tutor.tutorId) as any).n
  const panelCount = (db.prepare(`
    SELECT COUNT(*) as n FROM panel
    WHERE manuscriptId IN (
      SELECT manuscriptId FROM manuscript
      WHERE studentId IN (SELECT studentId FROM student WHERE tutorId = ?)
    )
  `).get(tutor.tutorId) as any).n

  console.log(`\n🗑️  Removing user: ${email}`)
  console.log(`   tutorCode  : ${tutor.tutorCode}`)
  console.log(`   lessons    : ${lessonCount}`)
  console.log(`   students   : ${studentCount}`)
  console.log(`   manuscripts: ${manuscriptCount}`)
  console.log(`   panels     : ${panelCount}\n`)

  // Deleting the tutor cascades to all child tables (foreign keys with ON DELETE CASCADE)
  db.prepare('DELETE FROM tutor WHERE tutorId = ?').run(tutor.tutorId)

  // TODO: remove image files created for this user

  console.log('✅  User and all associated data removed.\n')
} catch (error) {
  console.error('Error removing user:', error)
  process.exit(1)
} finally {
  db.close()
}
