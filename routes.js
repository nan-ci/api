const { required, oneOf, optional, between } = require('4k/route-helper')

const {
  mailgun,
  github,
  dns,
  users,
  server,
 } = require('./handlers')
const game01 = require('./game01/game01')

const isArrayOfArray = value => {
  if (!Array.isArray(value) || !value.every(Array.isArray)) {
    throw Error("Array of Array expected")
  }
  return value
}

module.exports = {
  OAUTH: {
    github: github.oauth,
  },
  GET: {
    '/session': {
      description: 'log user data',
      handler: ({ session }) => session,
    },
    '/game01/start': {
      description: 'Init game session & return initial (or current) level data',
      handler: game01.start,
    },
    '/users/locations': {
      description: 'Get all user locations',
      noSession: true, // should be authenticated
      handler: users.getLocations,
    },
    '/server/alive': {
      description: 'Get server alive status',
      noSession: true,
      handler: server.isAlive,
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
    '/users/locations': {
      description: 'Set a user location',
      noSession: true, // should be authenticated
      params: { login: required(String), location: required(String) },
      handler: users.setLocation,
    },
    '/server/alive': {
      description: 'Set server is alive',
      noSession: true, // should be authenticated
      handler: server.alive,
    },
    '/game01/next': {
      description: 'Submit answer & return next level data',
      params: { answer: isArrayOfArray },
      handler: game01.next,
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
