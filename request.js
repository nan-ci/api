const http = require('http')
const https = require('https')
const { parse: parseUrl } = require('url')
const { stringify: queryStringify } = require('querystring')
const { error } = require('./errors')

const isJSON = headers => headers
  && headers['Content-Type'] === 'application/json'

module.exports = (opts, data) => new Promise((s, f) => {
  typeof opts === 'string' && (opts = parseUrl(opts))
  opts.url && (opts = Object.assign(parseUrl(opts.url, opts)))
  opts.method || (opts.method = 'GET')
  if (data && typeof data !== 'string') {
    if (isJSON(opts.headers)) {
      data = JSON.stringify(data)
    } else if (opts.method === 'GET') {
      opts.path += '?'+ queryStringify(data)
      data = ''
    } else {
      data = queryStringify(data)
    }
  }

  const req = (opts.protocol === 'http:' ? http : https).request(opts, res => {
    const body = []
    res.setEncoding(opts.encoding || 'utf-8')
      .on('data', chunk => body.push(chunk))
      .on('error', f)
      .on('end', () => {
        if (res.statusCode !== 200) return f(error[res.statusCode])
        try { s(res.bodyText = body.join('')) }
        catch (err) {
          err.res = res
          f(err)
        }
      })
  })
  .on('error', f)
  req.end(data)
})
