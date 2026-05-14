import type { BuildAction } from 'remix/fetch-router'
import { routes } from '@/routes'

export const removeLesson: BuildAction<'POST', typeof routes.removeLesson> = {
  async handler() {
    return Response.json({ success: true, message: 'Lesson removed' })
  }
}
