import { ApiFetchEvent } from 'solid-start/api/types'
import { json } from 'solid-start/server'
import getPrintableRequest from '~/lib/getPrintableRequest'
import { useGrant } from '~/lib/grant'

const echo = async (event: ApiFetchEvent) => {
  const { env, params } = event

  const grantApi = useGrant()

  const request = await getPrintableRequest(event.request)

  console.debug('request', request)
  console.debug('grant', grantApi?.get())

  return json({
    request,
    params,
    grant: grantApi?.get(),
    env,
  })
}

export const get = echo

export const post = echo
