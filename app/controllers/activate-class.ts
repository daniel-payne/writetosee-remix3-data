import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'

export const activateClass: BuildAction<'POST', typeof routes.activateClass> = {
  async handler() {
    return Response.json({ success: true, message: 'Class activated' })
  }
}
