const { createServer } = require('http')
const { c, to } = require('4k')
const { required } = require('4k/route-helper')
const server4k = require('4k/server')
const ws = require('./ws')
const db = require('./redis')
const routes = require('./routes')

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

const log = _ => (console.log(_), _)
const server = createServer(server4k({
  routes,
  domain: `https://api.${process.env.DOMAIN}`,
  allowOrigin: `https://${process.env.DOMAIN}`,
  session: {
    options: { domain: 'api.nan.ci', path: '/' },
    get: required(c([ db.get, db.get, JSON.parse ])),
    redirect: 'https://api.nan.ci/session',
  },
})).listen(process.env.API_PORT, () => {
  console.info(`server started: http://localhost:${process.env.API_PORT}`)
})

ws.init(server)

module.exports = server

// It return JSON statusCode 200 by default
// If you want to handle the answer yourself, you must resolve to a function
// This function will be called with the response
// and a function to parse the result as your are now responsible to close the request

// Restrictions:
// you may not use 'req' as param name

// bodyOpts

