import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'

export const deactivateLesson: BuildAction<'POST', typeof routes.deactivateLesson> = {
  async handler() {
    return Response.json({ success: true, message: 'Lesson deactivated' })
  }
}
