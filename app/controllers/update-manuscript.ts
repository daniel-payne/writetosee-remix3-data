import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'
import { Database } from 'remix/data-table'
import { manuscriptTable } from '@/data/schema'
import { requireClass, StudentId } from '@/middleware/requireClass'
import { formatData } from '@/utils/formatData'

export const updateManuscript: BuildAction<'POST', typeof routes.updateManuscript> = {
  middleware: [requireClass()],
  async handler({ request, get }: any) {
    const db = get(Database)
    const studentId = get(StudentId).id

    let body: any
    try {
      body = await request.json()
    } catch {
      return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
    }

    const { manuscriptCode, text } = body
    if (!manuscriptCode) {
      return Response.json({ success: false, error: 'Missing manuscriptCode' }, { status: 400 })
    }

    const manuscript = await db.findOne(manuscriptTable, { where: { manuscriptCode, studentId } })
    if (!manuscript) {
      return Response.json({ success: false, error: 'Manuscript not found' }, { status: 404 })
    }

    await db.update(manuscriptTable, manuscript.manuscriptId, { text: text ?? null })

    const updated = await db.findOne(manuscriptTable, { where: { manuscriptId: manuscript.manuscriptId } })

    return Response.json({
      success: true,
      message: 'Manuscript updated',
      data: formatData(updated),
    })
  }
}
