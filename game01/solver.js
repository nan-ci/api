const flatMap = require('lodash/flatMap')
const cloneDeep = require('lodash/cloneDeep')

const {
  NO, FW, TL, TR, P1, P2, P3, F0, F1, F2, C1, C2, C3,
  allInstructions,
  getPossibleInstructions
} = require('./instructions')

const stackMaxSize = 100

const solve = (level, answer) => {
  level = cloneDeep(level)
  // verify lengths
  if (answer.length !== level.functions.length
    || !answer.every((f, i) => f.length === level.functions[i].length)) {
    console.log('invalid lengths')
    return false
  }

  // verify instructions are valids
  const possibleInstructions = getPossibleInstructions(level.activeInstructions)
  if (!flatMap(answer).every(v => possibleInstructions.includes(v))) {
    console.log('invalid instructions')
    return false
  }

  // prepare
  const f = answer
  level.stack = [...f[0]]
  level.answer = answer

  // run
  while (level.stars) {
    if (!level.stack.length) {
      console.log('empty stack')
      return false
    }

    if (level.stack.length > stackMaxSize) {
      console.log('stack max size reached')
      return false
    }

    if (isPlayerDead(level.player, level.board)) {
      console.log('player is either dead or out of bounds')
      return false
    }

    const current = level.stack.shift()
    const condition = Math.floor(current / 100)
    const instruction = current % 100

    const p = level.player
    const currentCell = level.board[p.y][p.x]
    const currentCellColor = currentCell % 4
    if (condition && condition !== currentCellColor) {
      continue // skip
    }

    applyInstruction(level, instruction)
  }

  return true
}

const hasStar = cell => cell > 3
const pickupStar = cell => cell - 4
const isPlayerOutOfBounds = p => p.x < 0 || p.x > 9 || p.y < 0 || p.y > 9
const isPlayerDead = (p, board) => isPlayerOutOfBounds(p) || !board[p.y][p.x]

const paint = (level, color) => {
  const board = level.board
  const p = level.player
  const currentColor = board[p.y][p.x] % 4
  board[p.y][p.x] = board[p.y][p.x] - currentColor + color
}

const repeatFunction = (level, id) =>
  level.stack = level.answer[id].concat(level.stack)

// should not mutate level & return a new level state
const applyInstruction = (level, instruction) => {
  switch (instruction) {
    case NO: return

    case FW: {
      const board = level.board

      // move
      const p = level.player
      if (p.direction === 0) { p.x -= 1 }
      if (p.direction === 1) { p.y -= 1 }
      if (p.direction === 2) { p.x += 1 }
      if (p.direction === 3) { p.y += 1 }

      // check for star
      if (!isPlayerDead(p, board) && hasStar(board[p.y][p.x])) {
        board[p.y][p.x] = pickupStar(board[p.y][p.x])
        level.stars -= 1
      }

      return
    }

    case TL: {
      level.player.direction = (level.player.direction + 3) % 4
      return
    }

    case TR: {
      level.player.direction = (level.player.direction + 1) % 4
      return
    }

    case P1: return paint(level, 1)
    case P2: return paint(level, 2)
    case P3: return paint(level, 3)

    case F0: return repeatFunction(level, 0)
    case F1: return repeatFunction(level, 1)
    case F2: return repeatFunction(level, 2)

    default: return
  }
}

module.exports = {
  solve,
  applyInstruction,
}
