const path = require("path")

const isProd = process.env.NODE_ENV === "production"

function resolve(dir) {
  return path.join(__dirname, dir)
}

let baseConfig = {
  css: {
    loaderOptions: {
      sass: {
        prependData: `@import "assets/scss/baseParams.scss";`
      }
    }
  },
  runtimeCompiler:true,
  chainWebpack: config => {
    config.resolve
      .alias.set("assets", resolve("src/common/assets"))
        .set("components", resolve("src/common/components"))
        .set("utils", resolve("src/utils"))
        .set("hooks", resolve("src/hooks"))
        .set("constants", resolve("src/constants"))
  },
  configureWebpack: config => {
    if (isProd) {
      config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true
    }
  }
}

if (isProd) {
  let prodConfig = {
    productionSourceMap: false
  }
  baseConfig = { ...baseConfig, ...prodConfig }
}else{
  let devConfig = {
    devServer: {
      historyApiFallback: {
        index: '/index.html'
      }
    }
  }
  baseConfig = { ...baseConfig, ...devConfig }
}

module.exports = baseConfig
