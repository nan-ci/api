const http = require('http')
const { parse: parseUrl } = require('url')
const { parse: parseQuery } = require('querystring')
const routes = require('./routes')
const { isError, toJSON, error: { _404, _500 } } = require('./errors')
const isThennable = val => val && typeof val.then === 'function'
const { IS_ASYNC, PARAMS, ERROR } = require('./shared')
const body = require('body/any')

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

Object.keys(routes).forEach(methodKey =>
  Object.keys(routes[methodKey]).forEach(routeKey => {
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

http.createServer((req, res) => {
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
