'use strict'
const bytenode = require('./bytenodeCompileFile.js')

let script = ''
process.stdin.setEncoding('utf-8')
process.stdin.on('readable', () => {
  const data = process.stdin.read()
  if (data !== null) {
    script += data
  }
})
process.stdin.on('end', () => {
  try {
    process.stdout.write(bytenode.compileCode(script))
  } catch (error) {
    console.error(error)
  }
})
