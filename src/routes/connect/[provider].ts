import { ApiFetchEvent } from "solid-start/api/types";
import type { GrantConfig, GrantOptions } from 'grant'
import Grant from 'grant/lib/grant'
import Session from 'grant/lib/session'
import { json, redirect } from "solid-start/server";
import config from "../../config/oauth"
import { createCookieSessionStorage } from "solid-start/session";
import getPrintableRequest from "~/lib/getPrintableRequest";
import qs from 'qs'

const args = {config, session: {secret: 'graljk fsldkjf lkjsdflkjsdflkj sladkjfsdf jasfdljk'}}

const grant = Grant(args.config ? args as GrantConfig : {config: args} as GrantConfig)

const regex = new RegExp([
    '^',
    grant.config.defaults.prefix,
    /(?:\/([^\/\?]+?))/.source, // /:provider
    /(?:\/([^\/\?]+?))?/.source, // /:override?
    /(?:\/$|\/?\?+.*)?$/.source, // querystring
  ].join(''), 'i')

const sessionSecret = import.meta.env.SESSION_SECRET || 'a bdfjf slkdjflsjdflkjsdf lkjsdf;l kjsdflkj df';

const store = Session(args.session)

const storage = createCookieSessionStorage({
  cookie: {
    name: "oauth_session",
    // secure doesn't work on localhost for Safari
    // https://web.dev/when-to-use-local-https/
    // secure: true,
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

const connectHandler = async (event: ApiFetchEvent) => {
  const { request, params, env} = event

  console.debug('request', await getPrintableRequest(event.request))
  console.debug('cookie headers', event.request.headers.get('Cookie'))
  console.debug('params', params)
  // console.debug('env', env)

  const currentSession = await getUserSession(request)

  console.debug('current session data', currentSession.data)

  const url = new URL(request.url)
  const query = qs.parse(url.search)
  const match = regex.exec(url.pathname)

  if (!match) {
    console.debug('session', currentSession)
    // return new Response(null, {headers: sessionk})
    return new Response()
  }

  const [, provider, override] = match

  console.debug('provider', provider, 'override', override)

  const {location, session: updatedSession, state} = await grant({
      method: request.method,
      params: {provider, override},
      query: query,
      body: request.body,
      state: env, //res.locals.grant,
      session: currentSession.data
      // session: new Proxy(
      //     currentSession, 
      //     {
      //         get (target, name, _receiver) {
      //             return target.get(name as string)
      //         },
      //
      //         set (target, prop, value, _receiver) {
      //             console.debug('called set ', prop, value)
      //             target.set(prop as string, value)
      //             return true
      //         },
      //     }
      // ), //req.session.grant,
    })

  for (const key of Object.keys(currentSession)) {
      currentSession.unset(key)
  }

  for (const [key, value] of Object.entries(updatedSession)) {
      currentSession.set(key, value)
  }

  // req.session.grant = session
  // res.locals.grant = state
  console.debug('updated session data', currentSession.data, updatedSession)

  const headers = {
      "Set-Cookie": await storage.commitSession(currentSession)
  }

  console.debug('headers', headers)

  const response = location 
      ? redirect(location, { headers })
      : new Response(null, { headers })
  // const response = new Response(null, { headers })

  console.debug('response', response)

  return response
}

export const get = connectHandler

export const post = connectHandler
