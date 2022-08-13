import { redirect } from 'solid-start/server'
import { createCookieSessionStorage } from 'solid-start/session'
import { db } from '.'
type LoginForm = {
  username: string
  password: string
}

export async function register(
  { username, password }: LoginForm,
  metadata?: Record<string, any>
) {
  return db.user.create({
    data: { username: username, password, metadata },
  })
}

export async function login({ username, password }: LoginForm) {
  const user = await db.user.findUnique({ where: { username } })
  if (!user) return null
  const isCorrectPassword = password === user.password
  if (!isCorrectPassword) return null
  return user
}

const sessionSecret = import.meta.env.SESSION_SECRET

const storage = createCookieSessionStorage({
  cookie: {
    name: 'RJ_session',
    // secure doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    secure: true,
    secrets: ['hello'],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
})

// I realize that I struggled to re-use this code for oauth because they threw redirects.
// I also wanted to make it clear that the values being returned are
// Set-Cookie header values, hence this type and the explicit type setting.
export type SetCookieHeaderValue = string

export class AuthenticationError extends Error {}

export class InvalidUserError extends AuthenticationError {}

export class UserNotFoundError extends AuthenticationError {}

export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'))
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request)
  const userId = session.get('userId')
  if (typeof userId !== 'string') throw new InvalidUserError()
  return userId
}

export async function requireUserId(request: Request) {
  const session = await getUserSession(request)
  const userId = session.get('userId')
  if (typeof userId !== 'string') {
    throw new InvalidUserError('Invalid user ID')
  }
  return userId
}

export async function getUser(request: Request) {
  const userId = await getUserId(request)
  try {
    const user = await db.user.findUnique({ where: { id: Number(userId) } })
    return user
  } catch {
    throw new UserNotFoundError(`Unable to find user ID ${userId}`)
  }
}

export async function logout(request: Request): Promise<SetCookieHeaderValue> {
  const session = await storage.getSession(request.headers.get('Cookie'))
  return await storage.destroySession(session)
}

export async function createUserSession(
  userId: string
): Promise<SetCookieHeaderValue> {
  const session = await storage.getSession()
  session.set('userId', userId)
  return await storage.commitSession(session)
}
