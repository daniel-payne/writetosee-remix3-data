import { createRouter } from 'remix/fetch-router'
import { asyncContext } from 'remix/async-context-middleware'
import { loadDatabase } from '@/middleware/db'

import { addLesson } from '@/controllers/add-lesson'
import { addTutor } from '@/controllers/add-tutor'
import { activateClass } from '@/controllers/activate-class'
import { closeSession } from '@/controllers/close-session'
import { deactivateClass } from '@/controllers/deactivate-class'
import { openSession } from '@/controllers/open-session'
import { removeLesson } from '@/controllers/remove-lesson'
import { addManuscript } from '@/controllers/add-manuscript'
import { updateManuscript } from '@/controllers/update-manuscript'
import { retrieveClass } from '@/controllers/retrieve-class'
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
router.map(routes.activateClass, activateClass)
router.map(routes.deactivateClass, deactivateClass)
router.map(routes.retrieveLessons, retrieveLessons)
router.map(routes.retrieveClass, retrieveClass)
router.map(routes.addManuscript, addManuscript)
router.map(routes.updateManuscript, updateManuscript)
