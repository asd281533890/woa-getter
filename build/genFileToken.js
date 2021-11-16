const crypto = require('crypto')
const hash = require('./hash.js')
const fs = require('fs-extra')
const reuqireBytenodeTemplate = fs.readFileSync('src/assets/bytenode/bytenodeRequireHacker.js', 'utf-8')
const yourPassword = 'asd281533890'
const fileToCheck = []
const obf = require('javascript-obfuscator')
const path = require('path')

const EXTNAME = 'jsc'

// javascript-obfuscator配置
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
  const finalHtml = `<!DOCTYPE html><html lang=""><head><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="referrer" content="never"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="app://./favicon.ico"><title>一键获取微信公众号推文信息</title><link href="app://./css/app.${hash}.css" rel="preload" as="style"><link href="app://./css/chunk-vendors.${hash}.css" rel="preload" as="style"><link href="app://./js/app.${hash}.js" rel="modulepreload" as="script"><link href="app://./js/chunk-vendors.${hash}.js" rel="modulepreload" as="script"><link href="app://./css/chunk-vendors.${hash}.css" rel="stylesheet"><link href="app://./css/app.${hash}.css" rel="stylesheet"></head><body><div id="app"></div><script type="module" src="app://./js/chunk-vendors.${hash}.js"></script><script type="module" src="app://./js/app.${hash}.js"></script><script>!function(){var e=document,t=e.createElement("script");if(!("noModule"in t)&&"onbeforeload"in t){var n=!1;e.addEventListener("beforeload",function(e){if(e.target===t)n=!0;else if(!e.target.hasAttribute("nomodule")||!n)return;e.preventDefault()},!0),t.type="module",t.src=".",e.head.appendChild(t),t.remove()}}();</script></body></html>`
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
  const jsFileItems = [
    [`./js/app.${hash}.js`, `./resources/app/js/app.${hash}.${EXTNAME}`],
    [`./js/chunk-vendors.${hash}.js`, `./resources/app/js/chunk-vendors.${hash}.${EXTNAME}`],
    ['./background.js', `./background.${EXTNAME}`],
    ['./preload.js', `./preload.${EXTNAME}`]
  ]
  jsFileItems.forEach(fileItem => {
    const pathToResourcesApp = fileItem[0] // 相对于app的目录
    const pathForRequire = fileItem[1] // 用于loaderJs引入的目录
    const hmac = crypto.createHmac('sha1', yourPassword)
    const code = obfCode(reuqireBytenodeTemplate + `require('${pathForRequire}')\n`)
    const fileSha256 = crypto.createHash('sha256').update(code)
    fileToCheck.push({
      pathRelativeToAppDir: pathToResourcesApp,
      token: hmac.update(fileSha256.digest('hex')).digest('hex')
    })
    fs.outputFileSync(path.resolve('build/resources/app', pathToResourcesApp), code)
  })
}

genHtmlToken()
genJsLoaderToken()

console.log(fileToCheck)

fs.writeFileSync('./src/background/fileToCheck.js', `module.exports = JSON.parse(\`${JSON.stringify(fileToCheck, null, 2)}\`)\n`)

process.exit(0)
