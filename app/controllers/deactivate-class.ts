import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'

export const deactivateClass: BuildAction<'POST', typeof routes.deactivateClass> = {
  async handler() {
    return Response.json({ success: true, message: 'Class deactivated' })
  }
}
