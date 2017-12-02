const cloneDeep = require('lodash/cloneDeep')
const db = require('../redis')
const { solve } = require('./solver')
const { levels, gameDuration, errors } = require('./constants')


const formatUserKey = userId => `game01:user:${userId}`

const hasGameExpired = user => Date.now() - user.startedAt > gameDuration

const getUser = key => db.get(key)
  .then(JSON.parse)

const newUser = id => {
  const now = Date.now()

  return {
    id,
    currentLevelId: 0,
    startedAt: now,
    levels: [
      { id: 0, startedAt: now }
    ]
  }
}

const updateUser = (_user, answer) => {
  const user = cloneDeep(_user)
  const now = Date.now()

  user.levels[user.currentLevelId] = {
    ...user.levels[user.currentLevelId],
    endedAt: now,
    answer
  }
  user.currentLevelId += 1
  user.levels.push({ id: user.currentLevelId, startedAt: now })

  return user
}


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

      user = updateUser(user, answer)

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
