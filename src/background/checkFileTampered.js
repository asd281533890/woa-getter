const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const fileToCheck = require('./fileToCheck.js')
const yourPassword = 'asd281533890'
const log = require('electron-log')

const checkFileTampered = () => {
  if (process.env.NODE_ENV !== 'production') {
    return Promise.resolve()
  }
  const checkPromises = []
  fileToCheck.forEach(file => {
    checkPromises.push(new Promise((resolve, reject) => {
      let fileContentStr = ''
      const fileSha256 = crypto.createHash('sha256')
      const stream = fs.createReadStream(path.join(__dirname, file.pathRelativeToAppDir))
      stream.on('data', data => {
        fileContentStr = data.toString()
        fileSha256.update(data)
      })
      stream.on('end', () => {
        const hmac = crypto.createHmac('sha1', yourPassword)
        const fileSha256Str = fileSha256.digest('hex')
        hmac.update(fileSha256Str)
        const myToken = hmac.digest('hex')
        if (myToken === file.token) {
          resolve(true)
        } else {
          const errMsg = `${file.pathRelativeToAppDir}文件校验失败，文件内容：\n${fileContentStr}\n校验程序算得的token：${myToken}，打包前算好的token：${file.token}`
          fs.writeFileSync('log.txt', errMsg)
          log.error(errMsg)
          reject(Error('校验文件失败'))
        }
      })
    }))
  })

  return Promise.all(checkPromises)
}

module.exports = checkFileTampered
