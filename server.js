const { createServer } = require('http')
const { c, to } = require('4k')
const { required, oneOf, optional, between } = require('4k/route-helper')
const server = require('4k/server')

const missingEnvKeys = [
  'MAILGUN_DOMAIN',
  'MAILGUN_LIST',
  'MAILGUN_APIKEY',
  'API_PORT',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'CLOUDFLARE_APIKEY',
  'CLOUDFLARE_ZONEID',
  'CLOUDFLARE_EMAIL' ].filter(key => !(key in process.env))

if (missingEnvKeys.length) {
  throw Error(`Missing environement variable ${missingEnvKeys.join(', ')}`)
}

const mailgun = require('./mailgun')
const github = require('./github')
const dns = require('./dns')

const routes = {
  OAUTH: {
    github: {
      authorizeUrl: 'https://github.com/login/oauth/authorize',
      accessUrl: 'https://github.com/login/oauth/access_token',
      // setState: an optionnal function that set a state
      // must return a key to said state (ex: redis key)
      // this key will be recieved in the handler as state
      handler: ({ access_token, scope, token_type, state, req }) => {
        // do whatever we want with the token here
        // then we return the session ID

        return '898abc879'
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
      noSession: true,
      params: { email: String, sub: Boolean },
      handler: ({ email, sub }) => mailgun.addEmail(email, sub),
    },
    '/dns/delete/': {
      description: 'Delete DNS record',
      params:  { record: required(String) },
      handler: dns.delete,
    },
    '/dns/details/': {
      description: 'DNS record details',
      params:  { record: required(String) },
      handler: dns.details,
    },
    '/dns/update/': {
      description: 'Update DNS record',
      params:  {
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
        name: required(String),
        content: required(String),
        type: required(oneOf('A AAAA CNAME TXT SRV LOC MX NS SPF'.split(' '))),
        proxied: optional(Boolean),
        ttl: optional(between(120, 2147483647)),
      },
      handler: dns.create,
    },
    '/dns/list/': {
      description: 'List DNS Records',
      params: {
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

module.exports = createServer(server({
  routes,
  domain: `https://api.${process.env.DOMAIN}`,
  allowOrigin: `https://${process.env.DOMAIN}`,
  getSession: cookies => {
    console.log(cookies)
  },
})).listen(process.env.API_PORT)

// It return JSON statusCode 200 by default
// If you want to handle the answer yourself, you must resolve to a function
// This function will be called with the response
// and a function to parse the result as your are now responsible to close the request

// Restrictions:
// you may not use 'req' as param name

// bodyOpts

