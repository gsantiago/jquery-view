/**
 * Gulp dependencies.
 */

var gulp = require('gulp')
var browserify = require('browserify')
var dependify = require('dependify')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var uglify = require('gulp-uglify')
var sourcemaps = require('gulp-sourcemaps')
var gutil = require('gulp-util')
var standard = require('gulp-standard')
var Server = require('karma').Server

/**
 * Browserify.
 */

gulp.task('browserify', function () {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: './jquery-view.js',
    debug: true
  }).plugin(dependify, {
    name: 'View',
    deps: {
      jquery: 'jQuery'
    }
  })

  return b.bundle()
    .pipe(source('jquery-view.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        .pipe(uglify())
        .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/'))
})

/**
 * Standard lint.
 */

gulp.task('standard', function () {
  return gulp.src(['./src/**/*.js'])
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true
    }))
})

/**
 * Karma.
 */

gulp.task('karma', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start()
})

/**
 * Test.
 */

gulp.task('test', ['standard', 'karma'])

/**
 * Watch.
 */

gulp.task('watch', function () {
  gulp.watch('src/**/*.js', ['browserify'])
})

/**
 * Default.
 */

gulp.task('default', ['test', 'browserify'])
