const setAlias = config => {
  config.resolve.alias
    .set('assets', '@/assets')
    .set('components', '@/components')
    .set('public', '@/../public')
    .set('utils', '@/utils')
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
      },
      chainWebpackRendererProcess: config => {
        setAlias(config)
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
