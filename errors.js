const { STATUS_CODES } = require('http')
const error = Object.create(null)
const boom = Object.create(null)
const S = Symbol('ERROR_TAG')
const J = Symbol('JSON_CACHE')
const isError = err => Boolean(err && err[S])
const stafeStringify = err => {
  try { return err[J] = JSON.stringify(err) }
  catch (e) { return error._500[J] }
}
const toJSON = err => (err && err[J]) || stafeStringify(err)

const buildError = (code, stack, message) => ({
  statusMessage: STATUS_CODES[code],
  statusCode: code,
  message: message || STATUS_CODES[code],
  [S]: true,
  stack,
})

Object.keys(STATUS_CODES).map(Number).map(code => {
  error[code] = error['_'+code] = buildError(code)
  error[code][J] = JSON.stringify(error[code])
  const handler = boom[code] = boom['_'+code] = (err = Error()) => {
    if (isError(err)) throw err
    if (err.stack) return buildError(code, err.stack, err.message)
    if (err.then) return err.then(undefined, handler)
    return buildError(code, Error(err).stack)
  }
})

module.exports = { boom, error, isError, toJSON }
