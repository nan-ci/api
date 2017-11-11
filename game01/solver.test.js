const test = require('./tester')

const {
  NO, FW, TL, TR, P1, P2, P3, F0, F1, F2, C1, C2, C3,
  allInstructions,
  getPossibleInstructions
} = require('./instructions')

const actives = ['FW', 'TL', 'TR', 'C1', 'C2', 'C3', 'P1', 'P2', 'P3', 'F0', 'F1', 'F2']
const _possibles = [
  NO, FW, TL, TR, P1, P2, P3, F0, F1, F2, C1, C2, C3,
  FW+C1, TL+C1, TR+C1, P1+C1, P2+C1, P3+C1, F0+C1, F1+C1, F2+C1,
  FW+C2, TL+C2, TR+C2, P1+C2, P2+C2, P3+C2, F0+C2, F1+C2, F2+C2,
  FW+C3, TL+C3, TR+C3, P1+C3, P2+C3, P3+C3, F0+C3, F1+C3, F2+C3,
]
const possibles = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 200, 300,
  101, 102, 103, 104, 105, 106, 107, 108, 109,
  201, 202, 203, 204, 205, 206, 207, 208, 209,
  301, 302, 303, 304, 305, 306, 307, 308, 309,
]

// test deepfreeze(actives)

test('# method: getPossibleInstructions', [
  t => t.deepEqual(getPossibleInstructions([FW, F0]), [NO, FW, F0], 'simple: instruction "NO" should be present'),
  t => t.deepEqual(getPossibleInstructions(['FW', 'F0']), [NO, FW, F0], 'handles "string" typed instructions entries'),
  t => t.deepEqual(getPossibleInstructions([FW, C1]), [NO, FW, C1, FW+C1], 'handles color conditions combinations'),
  t => t.deepEqual(getPossibleInstructions(actives), possibles, 'handles all combinations (pre-calculated)'),
  t => t.deepEqual(getPossibleInstructions(actives), _possibles, 'handles all combinations'),
])


const { solve, applyInstruction } = require('./solver')

const levels = [
  require('./levels/level1'),
  require('./levels/level2'),
  require('./levels/level2b'),
]

// test applyInstruction

test('# method: solve', [
  t => t.equal(solve(levels[0], [[FW, FW, FW]]), false, 'checker: invalid lengths'),
  t => t.equal(solve(levels[0], [[FW, FW], [FW]]), false, 'checker: invalid lengths #2'),
  t => t.equal(solve(levels[0], [[FW, TL]]), false, 'checker: invalid instruction'),
  t => t.equal(solve(levels[0], [[FW, 19]]), false, 'checker: invalid instruction #2'),
  t => t.equal(solve(levels[0], [[F0, NO]]), false, 'error: stack max size reached'),
  t => t.equal(solve(levels[0], [[FW, F0]]), true, 'level1: simple, with repeat function'),
  t => t.equal(solve(levels[0], [[FW, FW]]), false, 'level1: empty stack'),
  t => t.equal(solve(levels[1], [[FW, TL+C2, P1+C2, TL+C3, TL+C3, F0]]), true, 'level2: repeat, conditions, paint'),
  t => t.equal(solve(levels[1], [[FW, TL, FW, NO, NO, NO]]), false, 'level2: player died'),
  t => t.equal(solve(levels[2], [[FW, TL+C2, P1+C2, F1], [TL+C3, TL+C3, F0]]), true, 'level2b: multiple functions'),
])
