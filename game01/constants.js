const levels = [
  require('./levels/00'),
  require('./levels/01'),
  require('./levels/02'),
  require('./levels/03'),
] /*BETA*/

const ms = 1
const second = 1000 * ms
const minute = 60 * second
const hour = 60 * minute
const day = 24 * hour

const gameDurationLimit = 1 * hour // 2 * hours

const errors = {
  expiredGameSession: 'this game session has expired',
  unknownGameSession: 'this game session has ended or doesn\'t exists',
  invalidAnswer: 'this answer is invalid',
}

module.exports = {
  levels,
  time: {
    ms,
    second,
    minute,
    hour,
    day,
  },
  gameDuration,
  errors,
}
