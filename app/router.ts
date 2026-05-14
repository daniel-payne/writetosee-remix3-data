import { createRouter } from 'remix/fetch-router'
import { asyncContext } from 'remix/async-context-middleware'
import { loadDatabase } from '@/middleware/db'

import { addLesson } from '@/controllers/add-lesson'
import { addTutor } from '@/controllers/add-tutor'
import { activateLesson } from '@/controllers/activate-lesson'
import { closeSession } from '@/controllers/close-session'
import { deactivateLesson } from '@/controllers/deactivate-lesson'
import { openSession } from '@/controllers/open-session'
import { removeLesson } from '@/controllers/remove-lesson'
import { retrieveLessons } from '@/controllers/retrieve-lessons'
import { updateLesson } from '@/controllers/update-lesson'
import { routes } from '@/routes'


export const router = createRouter({
  middleware: [asyncContext(), loadDatabase()],
})

router.map(routes.addTutor, addTutor)
router.map(routes.openSession, openSession)
router.map(routes.closeSession, closeSession)
router.map(routes.addLesson, addLesson)
router.map(routes.updateLesson, updateLesson)
router.map(routes.removeLesson, removeLesson)
router.map(routes.activateLesson, activateLesson)
router.map(routes.deactivateLesson, deactivateLesson)
router.map(routes.retrieveLessons, retrieveLessons)
