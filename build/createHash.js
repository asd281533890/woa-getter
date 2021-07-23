const fs = require('fs')

const length = 8
let hash = ''
const arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
for (let i = 0; i < length; i++) {
  const pos = Math.round(Math.random() * (arr.length - 1))
  hash += arr[pos]
}

fs.writeFileSync('./build/hash.js', `module.exports = '${hash}'\n`)

process.exit(0)
