const sharedChainWebpack = config => {
  config.module
    .rule('eslint')
    .use('eslint-loader')
    .tap(options => {
      options.fix = true
      return options
    })
}

module.exports = {
  chainWebpack: config => {
    sharedChainWebpack(config)
    config.resolve.alias
      .set('assets', '@/assets')
      .set('components', '@/components')
      .set('public', '@/../public')
      .set('utils', '@/utils')
  },
  pluginOptions: {
    electronBuilder: {
      // chainWebpackMainProcess: config => {
      //   sharedChainWebpack(config)
      // },
      // chainWebpackRendererProcess: config => {
      //   sharedChainWebpack(config)
      // },
      nodeIntegration: true,
      preload: './src/utils/preload.js',
      builderOptions: {
        appId: 'com.woagetter.app',
        asar: false,
        productName: 'woaGetter',
        copyright: 'Copyright © 2021 Moving_J',
        win: {
          icon: './public/icon/woaGetterIcon.ico'
        },
        nsis: {
          installerIcon: './public/icon/woaGetterIcon.ico',
          installerHeaderIcon: './public/icon/woaGetterIcon.ico',
          oneClick: true,
          perMachine: true,
          allowElevation: true,
          shortcutName: '获取推送信息'
        }
      }
    }
  }
}
