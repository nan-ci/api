const redis = require('redis')
const { lazyProxy } = require('4k')
const client = redis.createClient({ password: process.env.REDIS_PASSWORD })

const events = ['connect', 'reconnecting', 'ready', 'end', 'error', 'warning']
  .forEach(e => client.on(e, err => console.info(`[Redis] ${e}`, err || '')))

const db = module.exports = lazyProxy((key, src) => {
  if (typeof client[key] === 'function') {
    // promisify functions
    return src[key] = (...args) => new Promise((s, f) =>
      client[key](...args, (e, r) => e ? f(e) : s(r)))
  }
  // define property for subsequent acces
  Object.defineProperty(src, key, { get: () => client[key] })
  return client[key]
})
