const db = require('../redis')

const alive = () => db.setex('server:alive', 10, 'true')

const isAlive = () => db.exists('server:alive').then(Boolean)

module.exports = {
  alive,
  isAlive,
}
