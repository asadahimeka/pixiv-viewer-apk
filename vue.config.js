const path = require('path')
const autoprefixer = require('autoprefixer')
const pxtorem = require('postcss-pxtorem')

const isProduction = process.env.NODE_ENV === 'production'
const svgIconDir = path.join(__dirname, 'src/icons/svg')

/** @type import('@vue/cli-service').ProjectOptions */
module.exports = {
  publicPath: '/',
  lintOnSave: false,
  runtimeCompiler: false,
  productionSourceMap: false,
  transpileDependencies: ['mint-filter'],
  configureWebpack: config => {
    config.resolve.alias['@capacitor/filesystem'] = '@himeka/capacitor-filesystem'
    if (isProduction) {
      config.optimization.minimizer[0].options.minimizer.options.compress.drop_console = true
    }
  },
  chainWebpack: config => {
    config
      .module
      .rule('vue')
      .use('vue-loader')
      .tap(args => {
        args.compilerOptions.whitespace = 'preserve'
      })

    config.module
      .rule('svg')
      .exclude.add(svgIconDir)
      .end()

    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(svgIconDir)
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]',
      })
      .end()

    if (isProduction) {
      config.plugins.delete('preload')
      config.plugins.delete('prefetch')
      config.optimization.minimize(true)
      config.optimization
        .splitChunks({
          chunks: 'all',
        })
    }
  },
  css: {
    sourceMap: false,
    loaderOptions: {
      postcss: {
        postcssOptions: {
          plugins: [
            autoprefixer(),
            pxtorem({
              rootValue: 75,
              propList: ['*'],
              selectorBlackList: ['van', 'fancybox', 'ispx'],
            }),
          ],
        },
      },
    },
  },
}
