const ms = 1
const second = 1000 * ms
const minute = 60 * second
const hour = 60 * minute
const day = 24 * hour

const gameDurationLimit = 20 * second

module.exports = {
  time: {
    ms,
    second,
    minute,
    hour,
    day,
  },
  gameDurationLimit,
}
