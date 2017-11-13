const { fs: { readdir, lstat }, flatten } = require('4k')
const { join, resolve } = require('path')

const getFiles = (dir, bl) => readdir(dir)
    .then(files => Promise.all(files
      .filter(file => !bl.includes(file))
      .map(file => join(dir, file))
      .map(file => lstat(file)
        .then(stat => stat.isDirectory() ? getFiles(file, bl) : resolve(file)))))
    .then(flatten)

module.exports = (dir, blackList) =>
  getFiles(dir, (blackList || []).map(f => join('.', f)))
