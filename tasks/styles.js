import gulp from 'gulp'
import autoprefixer from 'autoprefixer'
import gulpPlumber from 'gulp-plumber'
import gulpPostcss from 'gulp-postcss'
import gulpRename from 'gulp-rename'
import gulpRev from 'gulp-rev'
import gulpSass from 'gulp-sass'
import gulpStylelint from 'gulp-stylelint'
import postcssClean from 'postcss-clean'
import postcssReporter from 'postcss-reporter'

import errorHandler from './errorHandler'
import { globs } from '../gulp.config.js'

const styles = () =>
  gulp
    .src(globs.styles)
    .pipe(gulpPlumber({ errorHandler }))
    .pipe(gulpSass({ outputStyle: 'expanded' }))
    .pipe(
      gulpPostcss([
        postcssReporter({ clearReportedMessages: true }),
        autoprefixer,
        postcssClean,
      ])
    )
    .pipe(
      gulpStylelint({
        failAfterError: false,
        reporters: [{ formatter: 'verbose', console: true }],
      })
    )
    .pipe(gulpRev())
    .pipe(gulp.dest('dist/css'))
    .pipe(gulpRename({ dirname: 'css' }))
    .pipe(
      gulpRev.manifest('dist/manifest.json', {
        base: 'dist',
        merge: true,
      })
    )
    .pipe(gulp.dest('dist'))

styles.displayName = 'styles'

export default styles
