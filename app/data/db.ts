import { Database } from 'bun:sqlite'
import { createDatabase } from 'remix/data-table'
import { createSqliteDatabaseAdapter } from 'remix/data-table-sqlite'

const sqlite = new Database('./database.db')
sqlite.exec('PRAGMA foreign_keys = ON;')

export const db = createDatabase(createSqliteDatabaseAdapter(sqlite))
