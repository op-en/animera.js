const gulp = require('gulp')
const util = require('gulp-util')
const size = require('gulp-size')
const del = require('del')
const uglify = require('gulp-uglify')
const inject = require('gulp-inject')
const webpackStream = require('webpack-stream')
// const htmlmin = require('gulp-htmlmin')
const named = require('vinyl-named')
const pump = require('pump')
const replace = require('gulp-replace')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const watch = require('gulp-watch')

// set variable via $ gulp --type production
const environment = util.env.type || 'development'
const isProduction = environment === 'production'
const webpackConfig = require('./webpack.config.js').getConfig(environment)

const dist = 'dist/'
const widget = dist + 'widgets/'
const animeraPackage = require('./package.json')
const animeraPath = 'https://github.com/op-en/animera.js/releases/download/v' + animeraPackage.version + '/animera.js'

gulp.task('scripts', function (cb) {
  if (isProduction) {
    console.log('Production path to animera.js:' + animeraPath)
  }
  pump([
    gulp.src([webpackConfig.entry.animera, webpackConfig.entry.animeraWidget]),
    named(),
    webpackStream(webpackConfig),
    replace('<%= animeraPath %>', (isProduction ? animeraPath : 'http://localhost:8080/assets/animera.js')),
    isProduction ? uglify() : util.noop(),
    gulp.dest(dist),
    size({ title: 'js' })
  ],
    cb
  )
})

gulp.task('watch', ['scripts'], function (callback) {
  if (isProduction) {
    return
  }
  // Start a webpack-dev-server
  const compiler = webpack(webpackConfig)

  new WebpackDevServer(compiler, {
    hot: true,
    publicPath: '/assets/'
  }).listen(8080, 'localhost', function (err) {
    if (err) throw new util.PluginError('webpack-dev-server', err)
    // Server listening
    util.log('[webpack-dev-server]', 'http://localhost:8080/webpack-dev-server/index.html')

  // keep the server alive or continue?
  // callback()
  })
})

gulp.task('widgets', ['build'], function () {
  return gulp.src('./widgets/*.html')
    .pipe(isProduction ? util.noop() : watch('./widgets/*.html'))
    .pipe(inject(gulp.src(['./dist/AnimeraWidget.js']), {
      starttag: '<!-- inject:animerawidget:{{ext}} -->',
      transform: function (filePath, file) {
        // return file contents as string
        return '<script>' + file.contents.toString('utf8') + '</script>'
      }
    }))
    // .pipe(isProduction ? htmlmin({collapseWhitespace: true}) : util.noop())
    .pipe(gulp.dest(widget))
})

// remove bundels
gulp.task('clean', function (cb) {
  del([dist]).then(() => {
    cb()
  })
})

// by default build project and then watch files in order to trigger livereload
gulp.task('default', ['clean'], function () {
  gulp.start(['build', 'widgets', 'watch'])
})

gulp.task('build', ['scripts'])
