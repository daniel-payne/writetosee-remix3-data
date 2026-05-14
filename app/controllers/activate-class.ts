import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'

export const activateLesson: BuildAction<'POST', typeof routes.activateLesson> = {
  async handler() {
    return Response.json({ success: true, message: 'Lesson activated' })
  }
}
