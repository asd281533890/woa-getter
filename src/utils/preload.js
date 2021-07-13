import { registerWebviewPlatformBridgeForWebview } from './webviewBridge.js'

registerWebviewPlatformBridgeForWebview()

window.ipcRendererOnAsync('get-article-info', (data, returnMethod) => {
  const articleInfo = {}
  // 获取标题
  const titleEl = document.querySelector('#activity-name')
  if (titleEl) {
    articleInfo.title = titleEl.innerText
  }
  // 获取作者
  const authorEl = document.querySelector('#js_name')
  if (authorEl) {
    articleInfo.author = authorEl.innerText
  }
  // 获取摘要
  const summaryEl = document.querySelector('head > meta[property="og:description"]') || document.querySelector('head > meta[property="twitter:description"]')
  if (summaryEl) {
    articleInfo.summary = summaryEl.content
  }
  // 获取封面链接
  const coverEl = document.querySelector('head > meta[property="og:image"]')
  if (coverEl) {
    articleInfo.coverLink = coverEl.content
  }
  console.log('get-article-info', articleInfo)
  returnMethod({ code: JSON.stringify(articleInfo) === '{}' ? 1 : 0, data: articleInfo })
})
