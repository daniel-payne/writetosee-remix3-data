import { createCookie } from 'remix/cookie'

export const classCookie = createCookie('class', {
  maxAge: 60 * 60 * 24, // 1 day
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax',
  path: '/',
})
