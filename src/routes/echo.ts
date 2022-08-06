import { ApiFetchEvent } from 'solid-start/api/types'
import { json } from 'solid-start/server'
import getPrintableRequest from '~/lib/getPrintableRequest'

const echo = async (event: ApiFetchEvent) => {
  const { env, params } = event

  const request = await getPrintableRequest(event.request)

  console.debug('request', request)

  return json({
    request,
    params,
    env,
  })
}

export const get = echo

export const post = echo
