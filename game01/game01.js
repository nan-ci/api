const db = require('../redis')
const { solve } = require('./solver')
const { gameDurationLimit, errors } = require('./constants')

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
  started: Date.now(),
})

const hasGameExpired = user => Date.now() - user.started > gameDurationLimit

const start = ({ session }) => {
  const key = formatUserKey(session.id)

  return getUser(key)
    .then(user => {
      if (!user) {
        return db.set(key, JSON.stringify(newUser(session.id)))
          .then(() => levels[0])
      }

      if (hasGameExpired(user)) throw Error(errors.expiredGameSession)

      return levels[user.currentLevelId]
    })
}

const next = ({ answer, session }) => {
  const key = formatUserKey(session.id)

  return getUser(key)
    .then(user => {
      if (!user) throw Error(errors.unknownGameSession)

      if (hasGameExpired(user)) throw Error(errors.expiredGameSession)

      const currentLevel = levels[user.currentLevelId]

      if (!solve(currentLevel, answer)) throw Error(errors.invalidAnswer)

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
