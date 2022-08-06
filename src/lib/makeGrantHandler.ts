import type { ApiFetchEvent } from 'solid-start/api/types'
import type { GrantConfig } from 'grant'
import { json, redirect } from 'solid-start/server'
import { createCookieSessionStorage } from 'solid-start/session'
import Grant from 'grant/lib/grant'
import { parse as parseQueryString } from 'qs'
import getPrintableRequest from './getPrintableRequest'

export interface SessionOptions {
  name?: string
  secret?: string
}

export interface ErrorHandling {
  /**
   * Whether to try to intercept errors and return a 400 response
   * or let the error messages get re-directed to the callback.
   *
   * This relies on a brittle method of inspecting the redirect
   * generated from grant, so it is probably best use for debugging only.
   */
  intercept?: boolean
}

export interface MakeGrantHandlerArgs {
  config: GrantConfig
  session?: SessionOptions
  debug?: boolean
  errorHandling?: ErrorHandling
}

// It's a brittle, hacky way to get errors, but it works for now...
// Would be nice if there was an option to throw errors - maybe that can be a PR...
const maybeGetErrorMessage = (location?: string) => {
  if (!location) return false

  const [, queryString] = location.split('?', 2)

  try {
    const params = new URLSearchParams(queryString)
    return params.has('error') ? params.get('error') : false
  } catch (e) {
    console.error(e)
  }

  return false
}

export const makeGrantHandler = (args: MakeGrantHandlerArgs) => {
  const {
    config,
    session: {
      name: sessionName = import.meta.env.SERVER_OAUTH_SESSION_NAME ||
        'oauth_session',
      secret: sessionSecret = import.meta.env.SERVER_OAUTH_SESSION_SECRET ||
        import.meta.env.SERVER_SESSION_SECRET,
    } = {},
  } = args

  args.debug &&
    console.debug('[GrantHandler] args', JSON.stringify(args, null, 2))

  const grant = Grant({ config })

  const storage = createCookieSessionStorage({
    cookie: {
      name: sessionName,
      // secure doesn't work on localhost for Safari,
      // and seems like it doesn't work on Chrome either?
      // https://web.dev/when-to-use-local-https/
      // secure: true,
      secrets: [sessionSecret],
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true, // make it a server-only cookie
    },
  })

  const getSession = async (request: Request) =>
    await storage.getSession(request.headers.get('Cookie'))

  const regex = new RegExp(
    [
      '^',
      grant.config.defaults.prefix,
      /(?:\/([^\/\?]+?))/.source, // /:provider
      /(?:\/([^\/\?]+?))?/.source, // /:override?
      /(?:\/$|\/?\?+.*)?$/.source, // querystring
    ].join(''),
    'i'
  )

  const baseHandler = async (request: Request, overrides?: Partial<GrantConfig>) => {
    args.debug &&
      console.debug(
        '[GrantHandler] request',
        await getPrintableRequest(request)
      )

    const userSession = await getSession(request)
    args.debug &&
      console.debug(
        '[GrantHandler] INCOMING session',
        JSON.stringify(userSession, null, 2)
      )

    const url = new URL(request.url)
    const query = parseQueryString(url.search.substring(1))

    const match = regex.exec(url.pathname)
    args.debug && console.debug('[GrantHandler] regex match', match)

    if (!match) return new Response(null, { status: 404 })

    const [, provider, override] = match

    args.debug &&
      console.debug(
        `[GrantHandler] provider(${provider}) override(${override})`
      )

    const { location, session: grantSession } = await grant({
      method: request.method,
      params: { provider, override },
      query: query,
      body: request.body,
      session: userSession.data,
      state: overrides
    })

    // clear the current session
    for (const key of Object.keys(userSession)) {
      userSession.unset(key)
    }

    // update the session with the new variables
    for (const [key, value] of Object.entries(grantSession)) {
      userSession.set(key, value)
    }

    args.debug && console.debug('[GrantHandler] OUTGOING session', grantSession)

    const headers = {
      'Set-Cookie': await storage.commitSession(userSession),
    }

    if (args.errorHandling?.intercept) {
      const errorMessage = maybeGetErrorMessage(location)
      if (errorMessage) {
        console.error(`[GrantHandler] ${errorMessage}`)
        return json({ error: errorMessage }, { status: 400 })
      }
    }

    const response = location
      ? redirect(location, { headers })
      : new Response(null, { headers })

    args.debug && console.debug('[GrantHandler] response', response)

    return response
  }

  const apiHandler = (event: ApiFetchEvent, config?: Partial<GrantConfig>) => baseHandler(event.request, config)

  return {
    baseHandler,
    apiHandler,
    getSession,
  }
}
