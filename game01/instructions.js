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

const getPossibleInstructions = instructions => {
  let _instructions = [...instructions]

  if (_instructions.every(i => typeof i === 'string')) {
    _instructions = _instructions.map(k => allInstructions[k])
  }

  const basics = _instructions.filter(i => i < 100)
  const conditions = _instructions.filter(i => i >= 100)

  return [
    NO,
    ...basics,
    ...conditions,
    ...conditions.reduce((arr, c) => arr.concat(basics.map(b => c + b)), [])
  ]
}

module.exports = {
  ...allInstructions,
  allInstructions,
  getPossibleInstructions,
}
