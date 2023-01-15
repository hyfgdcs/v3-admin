const { defineConfig } = require('@vue/cli-service')
let VUE_IS_LOCAL_DEVELOP = !process.env.VUE_APP_IS_BUILD && process.env.NODE_ENV === "development"
const path = require('path')
const WebpackBar = require('webpackbar')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const productionGzipExtensions = ['js', 'css']
const resolve = dir => {
  return path.join(__dirname, dir)
}
const TerserPlugin = require('terser-webpack-plugin')

// 线上打包路径，请根据项目实际线上情况
const BASE_URL = process.env.NODE_ENV === 'production' ? '/' : '/'

module.exports = defineConfig({
  publicPath: BASE_URL,
  outputDir: 'dist', // 打包生成的生产环境构建文件的目录
 
  assetsDir: 'public', // 放置生成的静态资源路径，默认在outputDir
  // indexPath: 'index.html', // 指定生成的 index.html 输入路径，默认outputDir
  pages: undefined, // 构建多页
  // transpileDependencies: true, // 把node_modules里用得到的高级语法进行babel编译
  // lintOnSave: VUE_IS_LOCAL_DEVELOP,// 是否在保存的时候检查
  lintOnSave: false,// 是否在保存的时候检查

  productionSourceMap: false,// 生产环境不输出 map 文件，以加速生产环境构建
  devServer: { // 开发环境配置
    open: VUE_IS_LOCAL_DEVELOP,//配置自动启动浏览器
    devMiddleware: {
      publicPath: '/',
    },
    // host: '127.0.0.1',
    hot: true, // 热更新
    port: '9999',
    // https: false,
    client: {
      overlay: {
        warnings: false,
        errors: true
      }
    },
    // 反向代理
    proxy: {
      // '/api/': { // 匹配规则
      //   target: '<url>',//设置你调用的接口域名和端口号 别忘了加http
      //   ws: true,
      //   pathRewrite: {
      //     "/api": "" // 这里理解成用‘/api’代替target里面的地址，后面组件中我们掉接口时直接用api代替 比如我要调用'http://40.00.100.100:3002/user/add'，直接写‘/api/user/add’即可
      //   changeOrigin: true,
      //   secure: false
      // }
    }
    // string | Object
    // before: app => { }
  },
  configureWebpack: () => {
    const config = {
      name: 'fs-admin',
      //     入口文件
      //     entry: './src/main.ts',
      //     output: {
      //         filename: process.env.NODE_ENV === 'production' ? '[name].[contenthash].js' : 'bundle.js',
      //         chunkFilename: 'chunks/[name].chunk.js'
      //     }
      // webpack 配置的项目名称, 可以在 index.html 中被访问，用来注入页面标题
      resolve: {
        fallback: {
          // 默认情况下，webpack5 不再包含用于 node.js 模块的 polyfills，所以引入 path-browserify
          path: require.resolve('path-browserify')
        },
        alias: {
          'lodash-es': 'lodash',
        }
      }
    };
    if (process.env.NODE_ENV === 'production') {
      config.plugins = [
        new WebpackBar(),
        new CompressionWebpackPlugin({
          algorithm: 'gzip',
          test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
          threshold: 10240,
          minRatio: 0.8
        })
      ]
      // 生产环境清除 console.log
      config.optimization = {
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              mangle: true,
              compress: {
                warnings: false,
                drop_console: false,
                drop_debugger: false,
                // 清除 console.log
                pure_funcs: ['console.log']
              },
              output: {
                // 删除注释
                comments: false
              }
            }
          })
        ]
      }
    }
    return config
  },
  chainWebpack: config => {
    // 配置路径别名
    config.resolve.alias
      .set('@', resolve('src'))
      .set('@_c', resolve('src/components'))
    if (VUE_IS_LOCAL_DEVELOP && 0) {
      config.module
        .rule("eslint")
        .use("eslint-loader")
        .loader("eslint-loader")
        .options({ fix: true }); // 自动完成修复
    }
    // 当有很多页面时，它会导致太多毫无意义的请求
    // config.plugins.delete('prefetch')
    // 开发环境 sourcemap 不包含列信息
    config.when(process.env.NODE_ENV === 'development',
      config => config.devtool('cheap-source-map')
    )
    // svg
    const dir = path.resolve(__dirname, 'src/icons/svg')
    config.module
      .rule('svg-sprite')
      .test(/\.svg$/)
      .include
      .add(dir)
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({ extract: false })
      .end()
    config.plugin('svg-sprite')
      .use(require('svg-sprite-loader/plugin')),
      [{ pluginSprite: true }]
    config.module
      .rule('svg')
      .exclude
      .add(dir)
    // 将运行代码单独生成文件
    if (process.env.NODE_ENV !== 'development') {
      config.cache({
        // 将缓存类型设置为 filesystem, 默认是 memory
        type: 'filesystem',
        buildDependencies: {
          // 更改配置文件时重新缓存
          config: [__filename]
        }
      })
      config.optimization.runtimeChunk('single')
    }
  },
  // css: {
  //     requireModuleExtension: false, // 启用 CSS modules
  //     extract: true, // 是否使用css分离插件
  //     sourceMap: VUE_IS_LOCAL_DEVELOP, // 开启 CSS source maps?
  //     loaderOptions: {} // css预设器配置项
  // },
  pluginOptions: {// 第三方插件配置
    // ...
  }
})
