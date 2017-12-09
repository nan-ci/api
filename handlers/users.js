const db = require('../redis')

const setLocation = ({ user, location }) => db.hset('locations', location, user)

const getLocations = () => db.hgetall('locations')

module.exports = {
  setLocation,
  getLocations,
}
