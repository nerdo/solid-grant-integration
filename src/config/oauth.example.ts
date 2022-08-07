const origin = 'http://localhost:3000'

export const config = {
  defaults: {
    origin,
  },
  github: {
    key: 'your app client key goes here',
    secret: 'secret key goes here',
    scope: ['openid', 'user'],
    callback: '/login',
  },
}

export default config

