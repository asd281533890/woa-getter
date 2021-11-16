console.log('process.versions.node:', process.versions.node)
console.log('process.versions.v8:', process.versions.v8)
console.log('process.cwd():', process.cwd())

const glob = require('glob')
const fs = require('fs-extra')
const path = require('path')
const { compileFile } = require('../src/assets/bytenode/bytenodeCompileFile.js')
const mergedirs = require('merge-dirs').default
const EXTNAME = 'jsc'

const compileJsToJsc = async context => {
  const compilePromises = []
  const allJsFilePaths = [
    `${context.appOutDir}/resources/app/*.js`,
    `${context.appOutDir}/resources/app/js/*.js`
  ]
  allJsFilePaths.forEach(jsPath => {
    glob.sync(jsPath).forEach(fullFilePath => {
      compilePromises.push(
        compileFile({
          filename: fullFilePath,
          output: path.join(path.dirname(fullFilePath), `${path.parse(fullFilePath).name}.${EXTNAME}`),
          electron: true
        })
      )
    })
  })
  return await Promise.all(compilePromises)
}

exports.default = async context => {
  try {
    const res = await compileJsToJsc(context)
    console.log(res)
    mergedirs('build/resources', `${context.appOutDir}/resources`, 'overwrite')
  } catch (error) {
    console.log(error)
  } finally {
    fs.removeSync('build/resources')
  }
}
