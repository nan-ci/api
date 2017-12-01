const db = require('../redis')
const { solve } = require('./solver')
const { levels, gameDuration, errors } = require('./constants')

const formatUserKey = userId => `game01:user:${userId}`

const getUser = key => db.get(key)
  .then(JSON.parse)

const newUser = id => ({
  id,
  currentLevelId: 0,
  startedAt: Date.now(),
})

const hasGameExpired = user => Date.now() - user.startedAt > gameDuration

const prepareResponse = (user, level) => {
  const done = level === undefined

  return {
    level,
    done,
    startedAt: user.startedAt,
    duration: gameDuration
  }
}

const start = ({ session }) => {
  if (!session || !session.id) return Error(errors.unknownGameSession)

  const key = formatUserKey(session.id)

  return getUser(key)
    .then(user => {
      if (!user) {
        user = newUser(session.id)

        return db.set(key, JSON.stringify(user))
          .then(() => prepareResponse(user, levels[0]))
      }

      if (hasGameExpired(user)) throw Error(errors.expiredGameSession)

      const level = levels[user.currentLevelId]

      return prepareResponse(user, level)
    })
    .catch(error => { throw error })
}

const next = ({ answer, session }) => {
  if (!session || !session.id) return Error(errors.unknownGameSession)

  const key = formatUserKey(session.id)

  return getUser(key)
    .then(user => {
      if (!user) throw Error(errors.unknownGameSession)

      if (hasGameExpired(user)) throw Error(errors.expiredGameSession)

      const currentLevel = levels[user.currentLevelId]

      if (!solve(currentLevel, answer)) throw Error(errors.invalidAnswer)

      user.currentLevelId += 1

      return db.set(key, JSON.stringify(user))
        .then(() => {
          const level = levels[user.currentLevelId]

          return prepareResponse(user, level)
        })
    })
    .catch(error => { throw error })
}

module.exports = {
  start,
  next,
  formatUserKey,
}
