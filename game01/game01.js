const db = require('../redis')
const { solve } = require('./solver')

// init -> set game01-USER_X EXP 2Hours

//  start -> ( EXISTS(game01:user) ? GET(game01:user) > GET(lvl) : SET(game01:user, lvl0) ) > send(lvl0)
//   lvl0 <-

// next#1 -> answer > GET(game01:user) > GET(lvl) > solve(lvl, answer) ? INC(lvl) > send(lvl) : false
//   lvl1 <-

// user01
// lvl0: {start: 100, end: 214}
// lvl1: {start: 100, end: 214}
// lvl..

const levels = [
  require('./levels/level1'),
  require('./levels/level2'),
  require('./levels/level2b'),
]

const formatUserKey = userId => `game01:user:${userId}`

const getUser = key => db.get(key)
  .then(JSON.parse)

const newUser = id => ({
  id,
  currentLevelId: 0,
})

const start = ({ session }) => {
  const key = formatUserKey(session.id)

  return db.exists(key)
    .then(exists => {
      if (exists) {
        return getUser(key)
          .then(user => levels[user.currentLevelId])
      }

      const user = newUser(session.id)

      return db.set(key, JSON.stringify(user))
        .then(() => levels[0])
    })
}

const next = ({ answer, session }) => {
  const key = formatUserKey(session.id)

  return getUser(key)
    .then(user => {
      if (!user) throw Error('uninitialized game') // fallback to 'start' ?

      const currentLevel = levels[user.currentLevelId]

      if (!solve(currentLevel, answer)) throw Error('invalid answer')

      user.currentLevelId += 1

      return db.set(key, JSON.stringify(user))
        .then(() => levels[user.currentLevelId])
    })
}

module.exports = {
  start,
  next,
  formatUserKey,
}
