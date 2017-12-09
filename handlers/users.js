const db = require('../redis')

const setLocation = ({ user, location }) => {
  return db.hset('locations', location, user)
}

const getLocations = () => {
  return db.hgetall('locations')
    .then(locations => {
      // error handling
      console.log('locations:', locations)

      return locations
    })
}

getLocations()

module.exports = {
  setLocation,
  getLocations,
}
