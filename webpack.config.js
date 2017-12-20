module.exports.getConfig = function (type) {
  var isDev = type === 'development'

  var config = {
    entry: {
      animera: './src/Animera.js',
      animeraWidget: './src/AnimeraWidget.js'
    },
    output: {
      path: __dirname,
      filename: '[name].js'
    },
    debug: isDev,
    module: {
      loaders: [{
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel', // 'babel-loader' is also a legal name to reference
        query: {
          presets: ['es2015']
        }
      }
      ]
    }
  }

  if (isDev) {
    config.devtool = 'eval'
  } else {
    // Enable this to strip all console logs from bundle

    // config.module.loaders.push({
    //   test: /\.js$/,
    //   exclude: /node_modules/,
    //   loader: 'strip-loader?strip[]=console.log'
    // })
  }

  return config
}
