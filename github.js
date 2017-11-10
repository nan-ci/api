const { use, t, post } = require('4k/request')
const api = require('4k/api')
const { c, to } = require('4k')

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

module.exports = {
  v3,
  v4,
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
