// Node Dependecies
const { createServer } = require('http')
const { randomBytes } = require('crypto')
const { parse: parseUrl } = require('url')
const { parse: parseQuery, stringify: stringifyQuery } = require('querystring')

// External Dependecies
const body = require('body/any')

// Internal Dependecies
const request = require('./request')
const { isError, toJSON, error: { _404, _500 } } = require('./errors')
const isThennable = val => val && typeof val.then === 'function'
const { IS_ASYNC, PARAMS, ERROR } = require('./shared')
const routes = require('./routes')
const domain = 'https://api.nan.ci'
const allowOrigin = 'https://nan.ci'

const formatUrl = (base, query) => `${base}?${stringifyQuery(query)}`
const getRedirect = (data, setState, authorizeUrl, goToLocation) => {
  if (!setState) {
    data.state = randomBytes(8).toString('hex')
    const location = formatUrl(authorizeUrl, data)
    return res => goToLocation(location, res)
  }
  const genLocation = (state, res) =>
    goToLocation(formatUrl(authorizeUrl, Object.assign({ state }, data)), res)
  return res => {
    const ret = setState(res)
    return isThennable(ret)
      ? ret.then(state => genLocation(state, res))
      : genLocation(ret, res)
  }
}

const handleRedirect = (location, res) => {
  res.statusCode = 302
  res.setHeader('location', location)
  res.end('"OK"')
}

const addOauthRoute = route => {
  const { authorizeUrl, serviceName, accessUrl, setState, handler, opts } = route
  const { scope, client_id, client_secret } = opts
  const redirect = getRedirect({
    redirect_uri: `${domain}/auth/${serviceName}/callback`,
    client_id,
    scope,
  }, setState, authorizeUrl, handleRedirect)
  const getUrl = Object.assign(parseUrl(accessUrl), {
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'NaN-App' },
    method: 'POST',
  })

  routes.GET[`/auth/${serviceName}`] = { handler: () => redirect }
  routes.GET[`/auth/${serviceName}/callback/`] = {
    params: { code: String, state: String },
    handler: ({ code, state, req }) => code
      ? request(getUrl, { client_secret, client_id, state, scope, code })
        .then(body => handler(Object.assign(parseQuery(body), { state, req })))
      : Error('missing oauth code'),
  }
}

const saveError = (ret, name, err) =>
  (ret[ERROR] || (ret[ERROR] = {}))[name] = err

const parseParam = (name, parser) => ret => {
  try {
    if (isThennable(ret[name] = parser(ret[PARAMS][name], ret))) {
      const q = ret[name]
        .then(v => ret[name] = v, err => saveError(ret, name, err))
      ret[IS_ASYNC] ? ret[IS_ASYNC].push(q) : (ret[IS_ASYNC] = [ q ])
    }
  } catch (err) { saveError(ret, name, err) }
  return ret
}

if (routes.OAUTH) {
  routes.GET || (routes.GET = Object.create(null))
  Object.keys(routes.OAUTH).forEach(serviceName =>
    addOauthRoute(Object.assign({ serviceName }, routes.OAUTH[serviceName])))
}

Object.keys(routes).forEach(methodKey =>
  methodKey !== 'OAUTH' && Object.keys(routes[methodKey]).forEach(routeKey => {
    const route = routes[methodKey][routeKey]
    const { params } = route
    if (params) {
      route.parse = Object.keys(params)
        .map(name => parseParam(name, params[name]))
        .reduce((prev, next) => ret => next(prev(ret)), _ => _)
      route.bodyOpts || (route.bodyOpts = {})
    }
  }))

const sendAnswerValue = (res, value) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', allowOrigin)
  if (typeof value === 'function') return value(res, sendAnswerValue)
  if (isError(value)) {
    res.statusCode = value.statusCode || value.code || 500
    res.statusMessage = value.statusMessage || value.message || _500.message
    return res.end(toJSON(value))
  }
  if (value instanceof Error) {
    res.statusCode = value.statusCode || value.code || 500
    res.statusMessage = value.statusMessage || value.message || _500.message
    return res.end(JSON.stringify({ stack: value.stack, message: value.message }))
  }
  try { res.end(JSON.stringify(value)) }
  catch (err) { sendAnswerValue(res, err) }
}

const sendAnswer = (res, answer) => {
  if (!isThennable(answer)) return sendAnswerValue(res, answer)
  const handle = val => sendAnswerValue(res, val)
  return answer.then(handle, handle)
}

const handleParamErrors = (res, params, handler) => params[ERROR]
  ? sendAnswer(res, _500)
  : sendAnswer(res, handler(params))

const parseRawParams = (req, res, route, rawParams) => {
  const params = route.parse({ [PARAMS]: rawParams, req })
  return params[IS_ASYNC]
    ? Promise.all(params[IS_ASYNC])
      .then(() => handleParamErrors(res, params, route.handler))
    : handleParamErrors(res, params, route.handler)
}

createServer((req, res) => {
  const methods = routes[req.method]
  if (!methods) return sendAnswerValue(res, _404)
  const { pathname, query } = parseUrl(req.url)
  const route = methods[pathname] || methods[pathname + '/']
  if (!route) return sendAnswerValue(res, _404)
  if (!route.params) return sendAnswer(res, route.handler({ req }))
  if (req.method === 'GET') return parseRawParams(req, res, route, parseQuery(query))
  return body(req, res, route.bodyOpts, (err, rawParams) => err
    ? sendAnswer(err)
    : parseRawParams(req, res, route, rawParams))
}).listen(process.env.API_PORT || 3546)
