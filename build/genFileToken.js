const crypto = require('crypto')
const hash = require('./hash.js')
const reuqireBytenodeTemplate = 'const v8 = require(\'v8\')\nv8.setFlagsFromString(\'--no-lazy\')\nrequire(\'bytenode\')\n'
// const vueCliConfig = require('../vue.config.js')
const fs = require('fs')
const yourPassword = 'asd281533890'
const fileToCheck = []

console.log('genFileToken hash', hash)

function genHtmlToken () {
  const finalHtml = `<!DOCTYPE html><html lang=""><head><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="referrer" content="never"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="app://./favicon.ico"><title>一键获取微信公众号推文信息</title><link href="app://./css/app.${hash}.css" rel="preload" as="style"><link href="app://./css/chunk-vendors.${hash}.css" rel="preload" as="style"><link href="app://./js/app.${hash}.js" rel="modulepreload" as="script"><link href="app://./js/chunk-vendors.${hash}.js" rel="modulepreload" as="script"><link href="app://./css/chunk-vendors.${hash}.css" rel="stylesheet"><link href="app://./css/app.${hash}.css" rel="stylesheet"></head><body><div id="app"></div><script type="module" src="app://./js/chunk-vendors.${hash}.js"></script><script type="module" src="app://./js/app.${hash}.js"></script><script>!function(){var e=document,t=e.createElement("script");if(!("noModule"in t)&&"onbeforeload"in t){var n=!1;e.addEventListener("beforeload",function(e){if(e.target===t)n=!0;else if(!e.target.hasAttribute("nomodule")||!n)return;e.preventDefault()},!0),t.type="module",t.src=".",e.head.appendChild(t),t.remove()}}();</script></body></html>`
  const fileSha256 = crypto.createHash('sha256')
  fileSha256.update(finalHtml)
  const hmac = crypto.createHmac('sha1', yourPassword)
  const fileSha256Str = fileSha256.digest('hex')
  hmac.update(fileSha256Str)
  fileToCheck.push({
    pathRelativeToDirname: 'index.html',
    token: hmac.digest('hex')
  })
}

function genJsLoaderToken () {
  // 注意：下面根据自己项目的实际文件目录配置，如果有多页面打包的，可以导入vue.config.js，获取pages对象，再遍历其文件路径
  // 渲染进程
  let fileSha256 = crypto.createHash('sha256')
  let hmac = crypto.createHmac('sha1', yourPassword)
  fileSha256.update(reuqireBytenodeTemplate + 'require(\'./resources/app/js/app.jsc\')\n')
  fileToCheck.push({
    pathRelativeToDirname: `js/app.${hash}.js`,
    token: hmac.update(fileSha256.digest('hex')).digest('hex')
  })
  // 预加载脚本preload
  fileSha256 = crypto.createHash('sha256')
  hmac = crypto.createHmac('sha1', yourPassword)
  fileSha256.update(reuqireBytenodeTemplate + 'require(\'./preload.jsc\')\n')
  fileToCheck.push({
    pathRelativeToDirname: 'preload.js',
    token: hmac.update(fileSha256.digest('hex')).digest('hex')
  })
  // 主进程background.js
  fileSha256 = crypto.createHash('sha256')
  hmac = crypto.createHmac('sha1', yourPassword)
  fileSha256.update(reuqireBytenodeTemplate + 'require(\'./background.jsc\')\n')
  fileToCheck.push({
    pathRelativeToDirname: 'background.js',
    token: hmac.update(fileSha256.digest('hex')).digest('hex')
  })
}

genHtmlToken()
genJsLoaderToken()

console.log(fileToCheck)

fs.writeFileSync('./src/background/fileToCheck.js', `module.exports = JSON.parse(\`${JSON.stringify(fileToCheck, null, 2)}\`)\n`)

process.exit(0)
