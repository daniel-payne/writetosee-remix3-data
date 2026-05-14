import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'
import { Database } from 'remix/data-table'
import { manuscriptTable } from '@/data/schema'
import { requireClass, StudentId } from '@/middleware/requireClass'
import { formatData } from '@/utils/formatData'

export const addManuscript: BuildAction<'POST', typeof routes.addManuscript> = {
  middleware: [requireClass()],
  async handler({ get }: any) {
    const db = get(Database)
    const studentId = get(StudentId).id

    let manuscript: any
    try {
      const result = await db.create(manuscriptTable, { studentId })
      if (result && typeof result.insertId === 'number') {
        manuscript = await db.findOne(manuscriptTable, { where: { manuscriptId: result.insertId } })
      } else {
        manuscript = result
      }
    } catch (err: any) {
      console.error(err)
      return Response.json({ success: false, error: 'Database error', message: err.message }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: 'Manuscript created',
      data: formatData(manuscript),
    })
  }
}
