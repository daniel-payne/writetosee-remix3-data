import { Database } from 'remix/data-table'
import { db } from '@/data/db'

export function loadDatabase() {
  return async (context: any, next: any) => {
    context.set(Database, db)
    return next()
  }
}
