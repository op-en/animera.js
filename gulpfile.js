var gulp = require('gulp')
var util = require('gulp-util')
var size = require('gulp-size')
var del = require('del')
var uglify = require('gulp-uglify')
var inject = require('gulp-inject')
var webpack = require('webpack-stream')
var htmlmin = require('gulp-htmlmin')
var named = require('vinyl-named')
var pump = require('pump')
// set variable via $ gulp --type production
var environment = util.env.type || 'development'
var isProduction = environment === 'production'
var webpackConfig = require('./webpack.config.js').getConfig(environment)

var dist = 'dist/'
var widget = dist + 'widgets/'

gulp.task('scripts', function (cb) {
  pump([
    gulp.src([webpackConfig.entry.animera, webpackConfig.entry.widgetutils]),
    named(),
    webpack(webpackConfig),
    isProduction ? uglify() : util.noop(),
    gulp.dest(dist),
    size({ title: 'js' })
  ],
    cb
  )
})

gulp.task('widgets', ['build'], function () {
  return gulp.src('./widgets/*.html')
    .pipe(inject(gulp.src(['./dist/widgetutils.js']), {
      starttag: '<!-- inject:widgetutils:{{ext}} -->',
      transform: function (filePath, file) {
        // return file contents as string
        return '<script>' + file.contents.toString('utf8') + '</script>'
      }
    }))
    .pipe(isProduction ? htmlmin({collapseWhitespace: true}) : util.noop())
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
  gulp.start(['build', 'widgets'])
})

gulp.task('build', ['scripts'])
