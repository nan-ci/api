const { STATUS_CODES } = require('http')
const mailgun = require('./mailgun')
const dns = require('./dns')
const github = require('./github')

const _login = _ => _.login
const getGithubLogin = token => github.user(token).then(_login)

const oneOf = list => val => {
  if (list.includes(val)) return val
  throw Error(val + ' must be one of '+ list.join(', '))
}
const between = (min, max) => val => val >= min && val <= max
const optional = fn => val => val === undefined ? val : fn(val)
const required = fn => val => {
  if (val === undefined) throw Error('required param')
  return fn(val)
}

module.exports = {
  OAUTH: {
    github: {
      authorizeUrl: 'https://github.com/login/oauth/authorize',
      accessUrl: 'https://github.com/login/oauth/access_token',
      // setState: an optionnal function that set a state
      // must return a key to said state (ex: redis key)
      // this key will be recieved in the handler as state
      handler: ({ access_token, scope, token_type, state, req }) => {
        // do whatever we want with the token here
        return 'OK'
      },
      opts: {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        scope: [
          'admin:org',
          'admin:public_key',
          'admin:repo_hook',
          'delete_repo',
          'gist',
          'public_repo',
          'user',
        ].join(' '),
      },
    },
  },
  POST: {
    '/email/': {
      description: 'Add an email to the list',
      params: { email: String, sub: Boolean },
      handler: ({ email, sub }) => mailgun.addEmail(email, sub),
    },
    '/dns/delete/': {
      description: 'Delete DNS record',
      params:  { token: getGithubLogin, record: required(String) },
      handler: dns.delete,
    },
    '/dns/details/': {
      description: 'DNS record details',
      params:  { token: getGithubLogin, record: required(String) },
      handler: dns.details,
    },
    '/dns/update/': {
      description: 'Update DNS record',
      params:  {
        token: getGithubLogin,
        name: required(String),
        content: required(String),
        type: required(oneOf('A AAAA CNAME TXT SRV LOC MX NS SPF'.split(' '))),
        proxied: optional(Boolean),
        ttl: between(120, 2147483647),
      },
      handler: dns.update,
    },
    '/dns/create/': {
      description: 'Create DNS record',
      params: {
        token: getGithubLogin,
        name: required(String),
        content: required(String),
        type: required(oneOf('A AAAA CNAME TXT SRV LOC MX NS SPF'.split(' '))),
        proxied: optional(Boolean),
        ttl: between(120, 2147483647),
      },
      handler: dns.create,
    },
    '/dns/list/': {
      description: 'List DNS Records',
      params: {
        token: getGithubLogin,
        name: required(String),
        type: optional(String),
        content: optional(String),
        page: optional(Number),
        per_page: optional(between(5, 1000)),
        order: optional(oneOf([ 'type', 'name', 'content', 'ttl', 'proxied' ])),
        direction: optional(oneOf([ 'asc', 'desc' ])),
        match: optional(oneOf([ 'any', 'all' ]))
      },
      handler: dns.list,
    },
  },
}

// It return JSON statusCode 200 by default
// If you want to handle the answer yourself, you must resolve to a function
// This function will be called with the response
// and a function to parse the result as your are now responsible to close the request

// Restrictions:
// you may not use 'req' as param name
