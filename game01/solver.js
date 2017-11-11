const flatMap = require('lodash/flatMap')
const cloneDeep = require('lodash/cloneDeep')
const level1 = require('./level1')
const level2 = require('./level2')

const {
  NO, FW, TL, TR, P1, P2, P3, F0, F1, F2, C1, C2, C3,
  allInstructions,
  getPossibleInstructions
} = require('./instructions')

const answer1 = [[FW, F0]]
const answer2 = [[FW, TL+C2, P1+C2, TL+C3, TL+C3, F0]]

const stackMaxSize = 100

const solve = (level, answer) => {

  // verify lengths
  if (answer.length !== level.functions.length
    || !answer.every((f, i) => f.length === level.functions[i].length)) {
    console.log('invalid lengths')
    return false
  }

  // verify instructions are valids
  const activeInstructions = level.activeInstructions.map(k => allInstructions[k])
  const possibleInstructions = getPossibleInstructions(activeInstructions)
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
      console.log('stack maximum call reached')
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

    level = applyInstruction(level, instruction)
  }

  return true
}

const hasStar = cell => cell > 3
const pickupStar = cell => cell - 4
const isPlayerOutOfBounds = p => p.x < 0 || p.x > 9 || p.y < 0 || p.y > 9
const isPlayerDead = (p, board) => isPlayerOutOfBounds(p) || !board[p.y][p.x]

const paint = (level, color) => {
  const board = cloneDeep(level.board)
  const p = level.player
  const currentColor = board[p.y][p.x] % 4
  board[p.y][p.x] = board[p.y][p.x] - currentColor + color

  return {
    ...level,
    board
  }
}

const repeatFunction = (level, id) => {
  return {
    ...level,
    stack: [
      ...level.answer[id],
      ...level.stack
    ]
  }
}

// should not mutate level & return a new level state
const applyInstruction = (level, instruction) => {
  switch (instruction) {
    case NO: return level

    case FW: {
      let board = level.board
      let stars = level.stars

      // move
      const p = { ...level.player }
      if (p.direction === 0) { p.x -= 1 }
      if (p.direction === 1) { p.y -= 1 }
      if (p.direction === 2) { p.x += 1 }
      if (p.direction === 3) { p.y += 1 }

      // check for star
      if (!isPlayerDead(p, board) && hasStar(board[p.y][p.x])) {
        board = cloneDeep(board)
        board[p.y][p.x] = pickupStar(board[p.y][p.x])
        stars -= 1
      }

      return {
        ...level,
        board,
        player: p,
        stars
      }

    }

    case TL: {
      return {
        ...level,
        player: {
          ...level.player,
          direction: (level.player.direction + 3) % 4
        }
      }
    }

    case TR: {
      return {
        ...level,
        player: {
          ...level.player,
          direction: (level.player.direction + 1) % 4
        }
      }
    }

    case P1: return paint(level, 1)
    case P2: return paint(level, 2)
    case P3: return paint(level, 3)

    case F0: return repeatFunction(level, 0)
    case F1: return repeatFunction(level, 1)
    case F2: return repeatFunction(level, 2)

    default: return level
  }
}

module.exports = {
  solve,
  applyInstruction,
}
