const fs = require('fs')
const v8 = require('v8')
const path = require('path')
const fork = require('child_process').fork
v8.setFlagsFromString('--no-lazy')
if (Number.parseInt(process.versions.node, 10) >= 12) {
  v8.setFlagsFromString('--no-flush-bytecode')
}
const COMPILED_EXTNAME = '.jsc'

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
  // @ts-ignore
  const compiledFilename = args.output || output || filename.slice(0, -3) + COMPILED_EXTNAME
  const javascriptCode = fs.readFileSync(filename, 'utf-8')
  const code = javascriptCode.replace(/^#!.*/, '')
  const bytecodeBuffer = await compileElectronCode(code)
  fs.writeFileSync(compiledFilename, bytecodeBuffer)
  return compiledFilename
}

global.bytenode = {
  compileFile,
  compileElectronCode
}

module.exports = {
  compileFile
}
