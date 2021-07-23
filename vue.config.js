const JavaScriptObfuscator = require('webpack-obfuscator')
const hash = require('./build/hash.js')

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
      simplify: true,
      // selfDefendinig: true, // 自我防卫，代码被更改后将不会正常运作，与bytenode冲突
      // debugProtection: true, // debug保护，与bytenode冲突
      disableConsoleOutput: true,
      deadCodeInjection: true,
      splitStrings: true,
      splitStringsChunkLength: 10,
      deadCodeInjectionThreshold: 0.1
    }])
  }
}

module.exports = {
  lintOnSave: 'error',
  productionSourceMap: false,
  configureWebpack: {
    devtool: false,
    target: 'electron-renderer',
    output: {
      filename: `js/[name].${hash}.js`,
      chunkFilename: `js/[name].${hash}.js`
    }
  },
  css: {
    extract: {
      filename: `css/[name].${hash}.css`,
      chunkFilename: `css/[name].${hash}.css`
    }
  },
  chainWebpack: config => {
    config.module
      .rule('eslint')
      .use('eslint-loader')
      .tap(options => {
        options.fix = true
        return options
      })
    setAlias(config)
    // config.plugins.delete('preload-app')
    // config.optimization.delete('splitChunks')
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
        afterPack: './build/afterPack.js',
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
      },
      externals: ['bytenode']
    }
  }
}
