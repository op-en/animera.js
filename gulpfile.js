const gulp = require('gulp')
const util = require('gulp-util')
const size = require('gulp-size')
const del = require('del')
const uglify = require('gulp-uglify')
const inject = require('gulp-inject')
const webpack = require('webpack-stream')
// const htmlmin = require('gulp-htmlmin')
const named = require('vinyl-named')
const pump = require('pump')
const replace = require('gulp-replace')

// set variable via $ gulp --type production
const environment = util.env.type || 'development'
const isProduction = environment === 'production'
const webpackConfig = require('./webpack.config.js').getConfig(environment)

const dist = 'dist/'
const widget = dist + 'widgets/'

gulp.task('scripts', function (cb) {
  pump([
    gulp.src([webpackConfig.entry.animera, webpackConfig.entry.widgetutils]),
    named(),
    webpack(webpackConfig),
    replace('<%= animeraPath %>', (isProduction ? 'http://op-en.github.io/animera.js/dist/animera.js' : '../animera.js')),
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
  gulp.start(['build', 'widgets'])
})

gulp.task('build', ['scripts'])
