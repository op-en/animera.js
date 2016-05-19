var gulp = require('gulp')
var util = require('gulp-util')
var size = require('gulp-size')
var uglify = require('gulp-uglify')
var del = require('del')
var webpack = require('webpack-stream')
// set variable via $ gulp --type production
var environment = util.env.type || 'development'
var isProduction = environment === 'production'
var webpackConfig = require('./webpack.config.js').getConfig(environment)

var dist = 'dist/'

gulp.task('scripts', function () {
  return gulp.src(webpackConfig.entry)
    .pipe(webpack(webpackConfig))
    .pipe(isProduction ? uglify() : util.noop())
    .pipe(gulp.dest(dist))
    .pipe(size({ title: 'js' }))
})

// remove bundels
gulp.task('clean', function (cb) {
  del([dist]).then(() => {
    cb()
  })
})

// by default build project and then watch files in order to trigger livereload
gulp.task('default', ['clean'], function () {
  gulp.start(['build'])
})

gulp.task('build', ['scripts'])
