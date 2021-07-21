const JavaScriptObfuscator = require('webpack-obfuscator')

const setAlias = config => {
  config.resolve.alias
    .set('assets', '@/assets')
    .set('components', '@/components')
    .set('public', '@/../public')
    .set('utils', '@/utils')
}

const addJavaScriptObfuscatorPlugin = config => {
  if (process.env.NODE_ENV === 'production') {
    config.plugin('obfuscator').use(JavaScriptObfuscator, [{
      compact: true, // 输出的代码压缩为一行
      // selfDefendinig: true, // 自我防卫，代码被更改后将不会正常运作，与bytenode冲突
      // debugProtection: true, // debug保护，与bytenode冲突
      disableConsoleOutput: false,
      deadCodeInjection: true,
      splitStrings: true,
      splitStringsChunkLength: 10,
      deadCodeInjectionThreshold: 0.1
    }])
  }
}

module.exports = {
  chainWebpack: config => {
    config.module
      .rule('eslint')
      .use('eslint-loader')
      .tap(options => {
        options.fix = true
        return options
      })
    setAlias(config)
  },
  pluginOptions: {
    electronBuilder: {
      chainWebpackMainProcess: config => {
        setAlias(config)
        addJavaScriptObfuscatorPlugin(config)
      },
      chainWebpackRendererProcess: config => {
        setAlias(config)
        addJavaScriptObfuscatorPlugin(config)
      },
      nodeIntegration: true,
      preload: './src/utils/preload.js',
      builderOptions: {
        appId: 'com.woagetter.app',
        asar: false,
        productName: 'WoaGetter',
        copyright: 'Copyright © 2021 Moving_J',
        win: {
          icon: './public/icon/woaGetterIcon.ico',
          target: [{
            target: 'nsis',
            arch: ['x64', 'ia32']
          }]
        },
        nsis: {
          // eslint-disable-next-line no-template-curly-in-string
          artifactName: '${productName}_installer_${version}.${ext}',
          installerIcon: './public/icon/woaGetterIcon.ico',
          installerHeaderIcon: './public/icon/woaGetterIcon.ico',
          oneClick: true,
          perMachine: true,
          allowElevation: true,
          shortcutName: '一键获取推送信息'
        }
      }
    }
  }
}
