/* webview内嵌页与webview所在页之间进行promise交互
用法：
1.webview内嵌页向webview所在页发送消息
webview内嵌页：
window.sendToHostAsync(channel, params, options).then(result => {
  // do something with result
}).catch(error => {
  // do something with error
})
webview所在页：
webview.addEventListenerAsync(channel, (params, returnMethod) => {
  // do something with params
  returnMethod(result)
})

2.webview所在页向webview内嵌页发送消息
webview所在页：
webview.sendToWebviewAsync(channel, params, options).then(result => {
  // do something
}).catch(error => {
  // do something
})
webview内嵌页：
window.ipcRendererOnAsync(channel, (data, returnMethod) => {
  // do something
  returnMethod(result)
})

result格式：
{
  code: 0或1, // 0会触发window.sendToHostAsync的then,非0触发catch
  data: Any,
  message: 'xxx成功' // code为非0时,catch会获得new Error(message)
}
 */

import uniqueId from 'lodash/uniqueId.js'
import { ipcRenderer } from 'electron'

const webviewToPlatformQueue = []
const platformToWebviewQueue = []

export function registerWebviewPlatformBridgeForWebview () {
  window.sendToHostAsync = (channel, params, options = { timeout: -1 }) => {
    const id = uniqueId()
    ipcRenderer.sendToHost('webview-call-async', channel, id, params)
    if (options.timeout !== -1) {
      setTimeout(() => {
        const cbIndex = webviewToPlatformQueue.find(evt => evt.id === id)
        if (cbIndex !== -1) {
          webviewToPlatformQueue[cbIndex].rejectCallback(new Error('超时'))
          webviewToPlatformQueue.splice(cbIndex, 1)
        }
      }, options.timeout)
    }
    return new Promise((resolve, reject) => {
      webviewToPlatformQueue.push({
        id,
        resolveCallback: res => resolve(res),
        rejectCallback: error => reject(error)
      })
    })
  }

  window.sendToHostAsyncReturn = res => {
    const cbIndex = webviewToPlatformQueue.findIndex(evt => evt.id === res.id)
    if (cbIndex !== -1) {
      if (res.code === 0) {
        webviewToPlatformQueue[cbIndex].resolveCallback(res.data)
      } else {
        webviewToPlatformQueue[cbIndex].rejectCallback(new Error(res.message || '未知错误'))
      }
      webviewToPlatformQueue.splice(cbIndex, 1)
    }
  }

  window.ipcRendererOnAsync = (realChannel, callback) => {
    ipcRenderer.on('platform-call-async', (e, channel, id, data) => {
      if (realChannel === channel) {
        const returnMethod = res => {
          ipcRenderer.sendToHost('platform-call-async-return', { id, ...res })
        }
        callback(data, returnMethod)
      }
    })
  }
}

export function registerWebviewPlatformBridgeForPlatform (webview) {
  webview.addEventListenerAsync = (channel, callback) => {
    webview.addEventListener('ipc-message', e => {
      if (e.channel === 'webview-call-async') {
        const realChannel = e.args[0]
        const id = e.args[1]
        const data = e.args[2]
        if (realChannel === channel) {
          const returnMethod = res => {
            const params = {
              id,
              code: res.code,
              data: res.data,
              message: res.message || ''
            }
            webview.executeJavascript(`window.sendToHostAsyncReturn(${JSON.stringify(params)})`)
          }
          callback(data, returnMethod)
        }
      }
    })
  }

  const id = uniqueId()

  webview.sendToWebviewAsync = (channel, params, options = { timeout: -1 }) => {
    webview.send('platform-call-async', channel, id, params)
    if (options.timeout !== -1) {
      setTimeout(() => {
        const cbIndex = platformToWebviewQueue.findIndex(evt => evt.id === id)
        if (cbIndex !== -1) {
          platformToWebviewQueue[cbIndex].rejectCallback(new Error('超时'))
          platformToWebviewQueue.splice(cbIndex, 1)
        }
      }, options.timeout)
    }
    return new Promise((resolve, reject) => {
      platformToWebviewQueue.push({
        id,
        resolveCallback: res => resolve(res),
        rejectCallback: error => reject(error)
      })
    })
  }

  webview.addEventListener('ipc-message', e => {
    if (e.channel === 'platform-call-async-return') {
      const res = e.args[0]
      const cbIndex = platformToWebviewQueue.findIndex(evt => evt.id === id)
      if (cbIndex !== -1) {
        if (res.code === 0) {
          platformToWebviewQueue[cbIndex].resolveCallback(res.data)
        } else {
          platformToWebviewQueue[cbIndex].rejectCallback(new Error(res.message || '未知错误'))
        }
        platformToWebviewQueue.splice(cbIndex, 1)
      }
    }
  })
}
