'use strict'

const fs = require('fs')
const vm = require('vm')
const v8 = require('v8')
const path = require('path')
const Module = require('module')
const fork = require('child_process').fork
const COMPILED_EXTNAME = '.jsc'

v8.setFlagsFromString('--no-lazy')
if (Number.parseInt(process.versions.node, 10) >= 12) {
  v8.setFlagsFromString('--no-flush-bytecode') // Thanks to A-Parser (@a-parser)
}

const compileCode = function (javascriptCode) {
  if (typeof javascriptCode !== 'string') {
    throw new Error(`javascriptCode must be string. ${typeof javascriptCode} was given.`)
  }
  const script = new vm.Script(javascriptCode, { produceCachedData: true })
  return (script.createCachedData && script.createCachedData.call) ? script.createCachedData() : script.cachedData
}

const compileElectronCode = function (javascriptCode) {
  return new Promise((resolve, reject) => {
    let data = Buffer.from([])
    const electronPath = path.join('node_modules', 'electron', 'cli.js')
    if (!fs.existsSync(electronPath)) {
      throw new Error('Electron not installed')
    }
    const bytenodePath = path.join(__dirname, 'cli.js')
    const proc = fork(electronPath, [bytenodePath, '--compile', '--no-module', '-'], {
      env: { ELECTRON_RUN_AS_NODE: '1' },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    })
    if (proc.stdin) {
      proc.stdin.write(javascriptCode)
      proc.stdin.end()
    }
    if (proc.stdout) {
      proc.stdout.on('data', (chunk) => {
        data = Buffer.concat([data, chunk])
      })
      proc.stdout.on('error', (err) => {
        console.error(err)
      })
      proc.stdout.on('end', () => {
        resolve(data)
      })
    }
    if (proc.stderr) {
      proc.stderr.on('data', (chunk) => {
        console.error('Error: ', chunk)
      })
      proc.stderr.on('error', (err) => {
        console.error('Error: ', err)
      })
    }
    proc.addListener('message', (message) => console.log(message))
    proc.addListener('error', err => console.error(err))
    proc.on('error', (err) => reject(err))
    proc.on('exit', () => { resolve(data) })
  })
}

const compileFile = async function (args, output) {
  const filename = args.filename
  if (typeof filename !== 'string') {
    throw new Error(`filename must be a string. ${typeof filename} was given.`)
  }
  const compiledFilename = args.output || output || filename.slice(0, -3) + COMPILED_EXTNAME
  if (typeof compiledFilename !== 'string') {
    throw new Error(`output must be a string. ${typeof compiledFilename} was given.`)
  }
  const javascriptCode = fs.readFileSync(filename, 'utf-8')
  const code = Module.wrap(javascriptCode.replace(/^#!.*/, ''))
  const bytecodeBuffer = await compileElectronCode(code)
  fs.writeFileSync(compiledFilename, bytecodeBuffer)
  return compiledFilename
}

module.exports = {
  compileCode,
  compileFile,
  compileElectronCode
}
