const { use, t, post } = require('4k/request')
const { randomBytes } = require('crypto')

const { c, to } = require('4k')
const api = require('4k/api')
const db = require('./redis')

const prepareOpts = c.fast([
  use({
    host: 'api.github.com',
    headers: { 'User-Agent': 'NaN-App' },
  }),
  t(opts => opts.headers.Authorization = `token ${opts.token}`),
])

const v3 = api(prepareOpts)
const v4 = query => token =>
  post(prepareOpts({ token, path: '/graphql', body: `{"query": "${query}"}` }))

const DAY = 86400
const oauth = {
  authorizeUrl: 'https://github.com/login/oauth/authorize',
  accessUrl: 'https://github.com/login/oauth/access_token',
  setState: res => {
    const key = randomBytes(12)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '-')

    return db.set(key, '', 'NX', 'EX', DAY)
      .then(success => success ? key : oauth.setState(res))
  },
  handler: ({ access_token: token, scope, token_type, state, req }) =>
    getUserInfo(access_token)
      .then(user => user.email
        ? user
        : (user.email = github.email(token))
          .then(() => user))
      .then(user => {
        Object.assign(user, { token, id: user.id.toString(36) })
        return Promise.all([
          db.setex(state, user.id, 14 * DAY),
          db.set(user.id, JSON.stringify(user)),
        ])
      })
      .then(() => state),
  opts: {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    scope: [
      'admin:org',
      'admin:public_key',
      'admin:repo_hook',
      'gist',
      'public_repo',
      'user',
    ].join(' '),
  },
}
module.exports = {
  v3,
  v4,
  oauth,
  login: c([
    v4('query { viewer { login }}'),
    to.data.viewer.login,
  ]),
  email: c([
    v3.get.user.emails,
    c.Array.filter(to.primary),
    to[0].email,
  ])
}
