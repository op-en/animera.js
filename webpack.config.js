module.exports.getConfig = function (type) {
  var isDev = type === 'development'

  var config = {
    entry: './src/index.js',
    output: {
      path: __dirname,
      filename: 'animera.js'
    },
    debug: isDev,
    module: {
      loaders: [{
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }, {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'strip-loader?strip[]=console.log' }
      ]
    }
  }

  if (isDev) {
    config.devtool = 'eval'
  }

  return config
}
