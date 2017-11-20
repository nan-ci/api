const NO = 0
const FW = 1
const TL = 2
const TR = 3
const P1 = 4
const P2 = 5
const P3 = 6
const F0 = 7
const F1 = 8
const F2 = 9
const C1 = 100
const C2 = 200
const C3 = 300

const allInstructions = { NO, FW, TL, TR, P1, P2, P3, F0, F1, F2, C1, C2, C3 }

const replaceKeyInstructions = key => typeof key === 'string'
  ? allInstructions[key]
  : key

const isBasic = c => c < C1

const addAllPossibles = (arr, c, i, instructions) => {
  arr.push(c)

  return isBasic(c)
    ? arr
    : arr.concat(instructions.filter(isBasic).map(b => c + b))
}

const getPossibleInstructions = instructions => instructions
  .map(replaceKeyInstructions)
  .reduce(addAllPossibles, [ NO ])

module.exports = {
  ...allInstructions,
  allInstructions,
  getPossibleInstructions,
}
