import { get, post, route } from 'remix/fetch-router/routes'

export const routes = route({
  addTutor: post('/add-tutor'),
  openSession: post('/open-session'),
  closeSession: post('/close-session'),
  addLesson: post('/add-lesson'),
  updateLesson: post('/update-lesson'),
  removeLesson: post('/remove-lesson'),
  activateClass: post('/activate-class'),
  deactivateClass: post('/deactivate-class'),
  retrieveLessons: get('/retrieve-lessons'),
})
