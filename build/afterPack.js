console.log('process.versions.node', process.versions.node)
console.log('process.versions.v8', process.versions.v8)
console.log('process.cwd()', process.cwd())

const glob = require('glob')
const path = require('path')
const fs = require('fs')
const bytenode = require('bytenode')
const vueConfig = require('../vue.config.js')
const lodashGet = require('lodash/get.js')

const outputPath = lodashGet(vueConfig, 'pluginOptions.electronBuilder.builderOptions.directories.output') || './dist_electron'

const filesToBytenode = {
  rendererProcess: {
    jsFilePath: `${outputPath}/win-unpacked/resources/app/js/*.js`,
    pathRelativeToExe: './resources/app/js/'
  },
  preloadAndMainProcess: {
    jsFilePath: `${outputPath}/win-unpacked/resources/app/*.js`,
    pathRelativeToExe: './'
  }
}

const requireBytenode = fs.readFileSync('src/assets/bytenode/index.js', 'utf-8')

const compileJsToJsc = () => {
  const compilePromises = []
  Object.keys(filesToBytenode).forEach(key => {
    glob.sync(filesToBytenode[key].jsFilePath).forEach(filename => {
      const jscFileName = `${path.basename(filename).split('.')[0]}.jsc`
      compilePromises.push(
        bytenode.compileFile({
          filename,
          output: `${path.dirname(filename)}/${jscFileName}`,
          electron: true
        }).then(res => {
          fs.writeFileSync(filename,
            requireBytenode + `require('${filesToBytenode[key].pathRelativeToExe}${jscFileName}')\n`)
          return res
        })
      )
    })
  })
  return Promise.all(compilePromises).then(res => {
    console.log(res)
  })
}

exports.default = async () => {
  await compileJsToJsc()
}
