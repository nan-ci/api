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

const start = ({ session }) => new Promise(s => {
  const key = formatUserKey(session.id)

  db.exists(key)
    .then(exists => {
      if (exists) {
        db.get(key)
          .then(JSON.parse)
            .then(user => s(levels[user.currentLevelId]))
      } else {
        const newUser = { currentLevelId: 0 }

        db.set(key, JSON.stringify(newUser))
        s(levels[0])
      }
    })
})

const nextLevel = userId => new Promise((s, f) => {
  const key = formatUserKey(userId)

  db.get(key)
    .then(JSON.parse)
      .then(user => {
        const nextLevelId = ++user.currentLevelId

        db.set(key, JSON.stringify(user))
        s(levels[nextLevelId])
      })
      .catch(err => f(err))
})

const next = ({ answer, session }) => new Promise ((s, f) => {
  const key = formatUserKey(session.id)

  db.get(key)
    .then(JSON.parse)
      .then(user => {
        const currentLevel = levels[user.currentLevelId]

        if (solve(currentLevel, answer)) {
          const nextLevelId = ++user.currentLevelId

          db.set(key, JSON.stringify(user))
          s(levels[nextLevelId])
        } else {
          f('invalid answer')
        }
      })
      .catch(err => f(err))
}

module.exports = {
  start,
  next,
  nextLevel,
  formatUserKey,
}
