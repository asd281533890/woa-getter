console.log('process.versions.node', process.versions.node)
console.log('process.versions.v8', process.versions.v8)
console.log('process.cwd()', process.cwd())

const glob = require('glob')
const fs = require('fs-extra')
const bytenode = require('bytenode')
const path = require('path')

const compileJsToJsc = context => {
  const compilePromises = []
  glob.sync(`${context.appOutDir}/resources/app/*.js`).forEach(fullFilePath => {
    compilePromises.push(
      bytenode.compileFile({
        filename: fullFilePath,
        output: fullFilePath + 'c',
        electron: true
      }).then(res => {
        fs.moveSync(`build/resourcesApp/${path.basename(fullFilePath)}`, fullFilePath, { overwrite: true })
        return res
      })
    )
  })

  return Promise.all(compilePromises).then(res => {
    console.log(res)
  })
}

exports.default = async context => {
  await compileJsToJsc(context)
}
