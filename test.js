const { pipe, Array: { filter, forEach } } = require('4k')
const getFiles = require('./readdir-recursive')

getFiles('.', [ '.git', 'node_modules' ])
  .then(pipe([ filter(f => /\.test\.js$/.test(f)), forEach(require) ]))
  .catch(console.error)
