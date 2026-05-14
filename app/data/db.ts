import { Database } from 'bun:sqlite'
import { createDatabase } from 'remix/data-table'
import { createSqliteDatabaseAdapter } from 'remix/data-table-sqlite'

const dbPath = process.env.DATABASE_PATH ?? './database.db'
const sqlite = new Database(dbPath)
sqlite.exec('PRAGMA foreign_keys = ON;')

export const db = createDatabase(createSqliteDatabaseAdapter(sqlite))
