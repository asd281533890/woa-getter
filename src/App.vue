<template>
  <div id="app">
    <div :class="{ logo: true, 'logo-loading': loading }">
      <img :src=" loading ? require('@/assets/images/logo-no-arrow.png'): require('@/assets/images/logo.png')" draggable="false">
      <i class="el-icon-loading" draggable="false"></i>
    </div>
    <div class="item-wrapper">
      <div class="info-item">
        <div class="item-name">推送链接：</div>
        <el-input
          v-model="link"
          size="small"
          spellcheck="false"
          @mousedown.native="linkInputMouseDownHandler"
          @keydown.native="e => link && e.key.toLowerCase() === 'enter' && clickGetHandler(link)"></el-input>
        <el-button size="small" @click="clickGetHandler(link)" :disabled="!link">获取</el-button>
        <el-button size="small" @click="copyText(link)" :disabled="!link">复制</el-button>
      </div>
      <div class="info-item">
        <div class="item-name">推送标题：</div>
        <el-input v-model="title" size="small" spellcheck="false" @mousedown.native="linkInputMouseDownHandler"></el-input>
        <el-button size="small" @click="copyText(title)" :disabled="!title">复制</el-button>
      </div>
      <div class="info-item">
        <div class="item-name">推送作者：</div>
        <el-input v-model="author" size="small" spellcheck="false" @mousedown.native="linkInputMouseDownHandler"></el-input>
        <el-button size="small" @click="copyText(author)" :disabled="!author">复制</el-button>
      </div>
      <div class="info-item">
        <div class="item-name">推送摘要：</div>
        <el-input
          v-model="summary"
          size="small"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 5 }"
          spellcheck="false"
          @mousedown.native="linkInputMouseDownHandler"></el-input>
        <el-button size="small" @click="copyText(summary)" :disabled="!summary">复制</el-button>
      </div>
      <div class="info-item cover">
        <div class="item-name">封面图片链接：</div>
        <el-input
          v-model="coverLink"
          size="small"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 5 }"
          spellcheck="false"
          @mousedown.native="linkInputMouseDownHandler"></el-input>
        <el-button
          size="small"
          @click="copyText(coverLink)"
          :disabled="!coverLink">复制</el-button>
        <el-image class="cover-image" :src="coverLink" alt="封面图片">
          <div slot="error" class="image-slot">
            <i class="el-icon-picture-outline"></i>
            <span>推送封面，可直接拖动保存</span>
          </div>
        </el-image>
        <el-button size="small" @click="saveCoverImage" :disabled="!coverLink">保存图片</el-button>
      </div>
    </div>
    <el-dialog
      top="30vh"
      width="370px"
      custom-class="about-dlg"
      append-to-body
      title="关于woa-getter"
      :visible.sync="showAboutDlg">
      <p>
        <span>如果你喜欢本软件，去</span>
        <span
          style="color: #069fff; text-decoration: underline; cursor: pointer"
          @click="shell.openExternal('https://github.com/asd281533890/woa-getter')"> 主页 </span>
        <span>给个star吧！</span>
      </p>
      <p>联系方式,有偿定制功能：281533890@qq.com</p>
    </el-dialog>
    <webview
      ref="webviewEl"
      src="about:blank"
      v-show="false"
      nodeintegration
      :preload="preload"
      webpreferences="nodeIntegration=1,contextIsolation=0,webSecurity=0"></webview>
  </div>
</template>

<script>
import { ipcRenderer, shell } from 'electron'
import { registerWebviewPlatformBridgeForPlatform } from 'utils/webviewBridge.js'
const global = ipcRenderer.sendSync('ask-global')

export default {
  name: 'App',
  data () {
    return {
      link: '',
      title: '',
      author: '',
      summary: '',
      coverLink: '',
      preload: global.webviewPreload,
      loading: false,
      showAboutDlg: false,
      shell
    }
  },
  created () {
    ipcRenderer.on('show-about', () => {
      this.showAboutDlg = true
    })
  },
  mounted () {
    registerWebviewPlatformBridgeForPlatform(this.$refs.webviewEl)
  },
  methods: {
    aaa (e) { console.log(e) },
    clickGetHandler (link) {
      this.loading = true
      this.resetData()
      if (link === '') {
        this.loading = false
        return this.$message({
          type: 'warning',
          message: '请输入推送链接',
          showClose: true
        })
      }
      if (link.startsWith('https://mp.weixin.qq.com') || link.startsWith('http://mp.weixin.qq.com')) {
        this.$nextTick(() => {
          const webviewEl = this.$refs.webviewEl
          webviewEl.addEventListener('did-finish-load', this.getArticleInfo, { once: true })
          webviewEl.loadURL(link)
        })
      } else {
        this.$message({
          type: 'warning',
          message: '请输入微信公众号推送的链接',
          showClose: true
        })
        this.loading = false
      }
    },
    getArticleInfo () {
      this.$refs.webviewEl.sendToWebviewAsync('get-article-info').then(articleInfo => {
        this.title = articleInfo.title
        this.author = articleInfo.author
        this.summary = articleInfo.summary
        this.coverLink = articleInfo.coverLink
        this.$message({ type: 'success', message: '获取成功', duration: 1200 })
      }).catch(() => {
        this.$message.warning('获取失败，请重试')
      }).finally(() => {
        this.loading = false
      })
    },
    saveCoverImage () {
      const aElement = document.createElement('a')
      aElement.download = this.coverLink
      aElement.href = this.coverLink
      aElement.click()
    },
    resetData () {
      this.title = ''
      this.author = ''
      this.summary = ''
      this.coverLink = ''
    },
    copyText (text) {
      this.$copyText(text).then(() => {
        this.$message({
          message: '复制成功',
          type: 'success',
          duration: 1000
        })
      }).catch(() => {
        this.$message({
          message: '复制失败',
          type: 'error',
          duration: 1000
        })
      })
    },
    linkInputMouseDownHandler (e) {
      if (e.button === 2) {
        ipcRenderer.send('pop-context-menu')
      }
    }
  }
}
</script>

<style lang="scss">
.about-dlg {
  .el-dialog__body {
    padding: 10px 20px 20px;
    p {
      margin: 2px 0;
    }
  }
}
.el-input {
  input {
    padding: 0 7px !important;
  }
}
.el-textarea {
  textarea {
    padding: 5px 7px !important;
  }
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  // margin-top: 70px;
  .item-wrapper {
    width: 580px;
    display: flex;
    flex-direction: column;
    align-content: flex-start;
    margin: 0 auto;
  }
  .logo {
    user-select: none;
    width: 580px;
    margin: 10px auto;
    display: flex;
    justify-content: center;
    position: relative;
    img {
      width: 70px;
      height: 70px;
    }
    i {
      position: absolute;
      top: 44px;
      left: 290px;
      font-size: 22px;
      font-weight: bold;
      color: #158fe7;
      display: none;
    }
    &.logo-loading {
      i {
        display: inline-block;
      }
    }
  }
  .info-item {
    padding: 10px;
    .item-name {
      display: block;
      user-select: none;
      font-size: 14px;
    }
    .el-textarea,
    .el-input {
      width: 400px;
      margin-right: 10px;
    }
  }
  .info-item.cover {
    img {
      margin-top: 5px;
      width: 400px;
    }
  }
  .cover-image {
    vertical-align: bottom;
    margin: 5px 10px 0 0;
    .image-slot {
      width: 400px;
      height: 169.6px;
      background-color: #e9e9e9;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }
  }
}
</style>
