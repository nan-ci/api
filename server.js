const { createServer } = require('http')
const { c, to } = require('4k')
const { required, oneOf, optional, between } = require('4k/route-helper')
const server = require('4k/server')
const db = require('./redis')

const missingEnvKeys = [
  'DOMAIN',
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
    github: github.oauth,
  },
  GET: {
    '/session': {
      description: 'log user data',
      handler: ({ session }) => session,
    },
  },
  POST: {
    '/session': { // TODO: rm
      description: 'create a session (used for debug)',
      params: { session: String, login: String, id: String, email: String, token: String },
      handler: ({ session, login, id, email, token }) => Promise.all([
        db.set(session, id),
        db.set(id, JSON.stringify({ login, id, email, token })),
      ]).then(() => res => {
        const cookie = require('cookie')
        res.setHeader('Set-Cookie',
          cookie.serialize('4k', session,  { path: '/', maxAge: 60*60*24*7 }))
        res.end('"OK"')
      }),
    },
    '/email': {
      description: 'Add an email to the list',
      noSession: true,
      params: { email: String, sub: Boolean },
      handler: ({ email, sub }) => mailgun.addEmail(email, sub),
    },
    '/dns/delete': {
      description: 'Delete DNS record',
      params:  { record: required(String) },
      handler: dns.delete,
    },
    '/dns/details': {
      description: 'DNS record details',
      params:  { record: required(String) },
      handler: dns.details,
    },
    '/dns/update': {
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
    '/dns/create': {
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
    '/dns/list': {
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

const log = _ => (console.log(_), _)
module.exports = createServer(server({
  routes,
  domain: `https://api.${process.env.DOMAIN}`,
  allowOrigin: `https://${process.env.DOMAIN}`,
  session: {
    options: { domain: 'api.nan.ci', path: '/' },
    get: c([ log, db.get, log, db.get, log, JSON.parse ]),
    redirect: 'https://api.nan.ci/session',
  },
})).listen(process.env.API_PORT, () => {
  console.info(`server started: http://localhost:${process.env.API_PORT}`)
})

// It return JSON statusCode 200 by default
// If you want to handle the answer yourself, you must resolve to a function
// This function will be called with the response
// and a function to parse the result as your are now responsible to close the request

// Restrictions:
// you may not use 'req' as param name

// bodyOpts

