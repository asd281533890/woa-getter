const crypto = require('crypto')
const hash = require('./hash.js')
const fs = require('fs-extra')
const reuqireBytenodeTemplate = fs.readFileSync('src/assets/bytenode/bytenodeRequireHacker.js', 'utf-8')
const yourPassword = 'asd281533890'
const fileToCheck = []
const obf = require('javascript-obfuscator')
const path = require('path')

const obfuscateOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false,
  debugProtectionInterval: false,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  rotateStringArray: true,
  selfDefending: true,
  shuffleStringArray: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
}

const obfCode = sourceCode => obf.obfuscate(sourceCode, obfuscateOptions).getObfuscatedCode()

function genHtmlToken () {
  const finalHtml = `<!DOCTYPE html><html lang=""><head><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="referrer" content="never"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="app://./favicon.ico"><title>一键获取微信公众号推文信息</title><link href="app://./app.${hash}.js" rel="modulepreload" as="script"><link href="app://./chunk-vendors.${hash}.js" rel="modulepreload" as="script"><link href="app://./css/app.${hash}.css" rel="preload" as="style"><link href="app://./css/chunk-vendors.${hash}.css" rel="preload" as="style"><link href="app://./css/chunk-vendors.${hash}.css" rel="stylesheet"><link href="app://./css/app.${hash}.css" rel="stylesheet"></head><body><div id="app"></div><script type="module" src="app://./chunk-vendors.${hash}.js"></script><script type="module" src="app://./app.${hash}.js"></script><script>!function(){var e=document,t=e.createElement("script");if(!("noModule"in t)&&"onbeforeload"in t){var n=!1;e.addEventListener("beforeload",function(e){if(e.target===t)n=!0;else if(!e.target.hasAttribute("nomodule")||!n)return;e.preventDefault()},!0),t.type="module",t.src=".",e.head.appendChild(t),t.remove()}}();</script></body></html>`
  const fileSha256 = crypto.createHash('sha256')
  fileSha256.update(finalHtml)
  const hmac = crypto.createHmac('sha1', yourPassword)
  const fileSha256Str = fileSha256.digest('hex')
  hmac.update(fileSha256Str)
  fileToCheck.push({
    pathRelativeToAppDir: 'index.html',
    token: hmac.digest('hex')
  })
}

function genJsLoaderToken () {
  fs.ensureDirSync('./build/resourcesApp')
  fs.removeSync('./build/resourcesApp')
  fs.ensureDirSync('./build/resourcesApp')

  const allJsFilePaths = [
    `./resources/app/app.${hash}.js`,
    `./resources/app/chunk-vendors.${hash}.js`,
    './preload.js',
    './background.js'
  ]

  allJsFilePaths.forEach(jsFilePath => {
    const jsFileBaseName = path.basename(jsFilePath)
    const fileSha256 = crypto.createHash('sha256')
    const hmac = crypto.createHmac('sha1', yourPassword)
    const code = obfCode(reuqireBytenodeTemplate + `require('${jsFilePath}c')\n`)
    fileSha256.update(code)
    fileToCheck.push({
      pathRelativeToAppDir: jsFileBaseName,
      token: hmac.update(fileSha256.digest('hex')).digest('hex')
    })
    fs.writeFileSync(`./build/resourcesApp/${jsFileBaseName}`, code)
  })
}

genHtmlToken()
genJsLoaderToken()

console.log(fileToCheck)

fs.writeFileSync('./src/background/fileToCheck.js', `module.exports = JSON.parse(\`${JSON.stringify(fileToCheck, null, 2)}\`)\n`)

process.exit(0)
