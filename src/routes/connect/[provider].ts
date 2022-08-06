import config from '~/config/oauth'
import { makeGrantHandler } from '~/lib/makeGrantHandler'

const { apiHandler, getSession } = makeGrantHandler({ config, debug: false })

// hmmm, not quite right...
export const getGrantSession = getSession

export const get = apiHandler

export const post = apiHandler
