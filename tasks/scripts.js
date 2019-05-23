import gulp from 'gulp'
import gulpPlumber from 'gulp-plumber'
import gulpRename from 'gulp-rename'
import gulpRev from 'gulp-rev'
import webpack from 'webpack'
import webpackStream from 'webpack-stream'

import errorHandler from './errorHandler'
import webpackConfigCreate from '../webpack.config.js'

const webpackConfig = webpackConfigCreate(process.env)

const scripts = () =>
  gulp
    .src('src/js/index.js')
    .pipe(gulpPlumber({ errorHandler }))
    .pipe(
      webpackStream(webpackConfig),
      webpack
    )
    .pipe(gulpRev())
    .pipe(gulp.dest('dist/js'))
    .pipe(gulpRename({ dirname: 'js' }))
    .pipe(
      gulpRev.manifest('dist/manifest.json', {
        base: 'dist',
        merge: true,
      })
    )
    .pipe(gulp.dest('dist'))

scripts.displayName = 'scripts'

export default scripts
