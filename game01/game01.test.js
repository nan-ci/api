const test = require('../tester')
const tape = require('tape')
const { start, next, formatUserKey } = require('./game01')

const {
  NO, FW, TL, TR, P1, P2, P3, F0, F1, F2, C1, C2, C3,
  allInstructions,
  getPossibleInstructions
} = require('./instructions')

const db = require('../redis')

const levels = [
  require('./levels/level1'),
  require('./levels/level2'),
  require('./levels/level2b'),
]

const session = { id: '1234.test' }
const key = formatUserKey(session.id)

tape('# method: start', t => {
  t.plan(5)
  db.exists(key)
    .then(reply => t.equal(reply, 0, `redis entry [${key}] should not exists`))
    .then(() => start({ session }))
    .then(lvl => t.deepEqual(lvl, levels[0], `entry doesn't exists, level returned should be 1st level`))
    .then(() => db.exists(key))
    .then(reply => t.equal(reply, 1, `redis entry [${key}] should exists`))
    .then(() => start({ session }))
    .then(lvl => t.deepEqual(lvl, levels[0], `entry exists, level returned should be user current level`))
    .then(() => db.del(key))
    .then(reply => t.equal(reply, 1, `redis entry [${key}] should be deleted`))
    .catch(t.fail)
})

test('# redis should close', t => db.quit().then(t.pass, t.fail))

// test('# method: nextLevel', [
//   t => start({ session })
//     .then(() => nextLevel(session.id))
//     .then(lvl => t.deepEqual(lvl, levels[1], `level returned should be the next one`), t.fail)
//     .then(() => db.del(key))
// ])
