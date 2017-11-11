const redis = require('redis')
const { lazyProxy } = require('4k')
const client = redis.createClient({ password: process.env.REDIS_PASSWORD })

module.exports = lazyProxy(key => (...args) => new Promise((s, f) =>
  client[key](...args, (e, r) => e ? f(e) : s(r))))
