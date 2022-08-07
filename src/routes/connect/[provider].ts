import { makeGrantHandler } from '~/lib/makeGrantHandler'

const { apiHandler, getSession } = makeGrantHandler({
  debug: false,

  // Using a deferred configuration here so that it can be
  // configured on the fly from environment variables (cloud deploy...)
  config: async () => {
    // previously this had a dynamic, async import()...
    return {
      defaults: {
        origin: 'http://localhost:3000',
      },
      github: {
        scope: ['openid', 'user'],
        callback: '/login',
        key: import.meta.env.SERVER_GITHUB_APP_CLIENT_ID,
        secret: import.meta.env.SERVER_GITHUB_APP_CLIENT_SECRET,
      },
    }
  },
})

// hmmm, not quite right...
export const getGrantSession = getSession

export const get = apiHandler

export const post = apiHandler
