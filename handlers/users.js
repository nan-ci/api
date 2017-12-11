const db = require('../redis')
const ws = require('../ws')

const setLocation = async ({ location, login }) => {
  const returnValue = await db.hset('locations', location, login)

  db.hgetall('locations').then(ws.emit)

  return returnValue
}

const getLocations = () => db.hgetall('locations')

module.exports = {
  setLocation,
  getLocations,
}
