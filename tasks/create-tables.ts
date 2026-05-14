import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Database } from 'bun:sqlite'

const specPath = join(process.cwd(), 'specification.md')
const specContent = readFileSync(specPath, 'utf8')

// Extract the SQL block from specification.md
const sqlMatch = specContent.match(/```sql\n([\s\S]*?)\n```/)
if (!sqlMatch) {
  console.error('Could not find SQL block in specification.md')
  process.exit(1)
}

const sqlCommands = sqlMatch[1]

// Extract table names to drop them first
const tableMatches = [...sqlCommands.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g)]
const tableNames = tableMatches.map((match) => match[1])

const db = new Database('./database.db')

try {
  console.log('--- Initializing Database ---')
  db.exec('PRAGMA foreign_keys = OFF;') // Disable temporarily to allow dropping tables

  // Drop tables in reverse order (to avoid foreign key constraint issues if we had them on, though they are off)
  for (const tableName of tableNames.reverse()) {
    console.log(`Dropping table ${tableName}...`)
    db.exec(`DROP TABLE IF EXISTS ${tableName};`)
  }

  db.exec('PRAGMA foreign_keys = ON;')

  console.log('Executing schema from specification.md...')
  // Split statements and run them, since Bun's db.exec might not handle multiple complex statements well in one go
  // Actually db.exec can handle multiple statements if they are separated by semicolon, but run() handles one.
  // We can just use db.exec(sqlCommands) but let's be careful.
  db.exec(sqlCommands)

  console.log('Database initialized successfully!')
} catch (error) {
  console.error('Error initializing database:', error)
  process.exit(1)
} finally {
  db.close()
}
