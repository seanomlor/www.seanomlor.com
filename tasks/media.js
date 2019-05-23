import gulp from 'gulp'
import gulpPlumber from 'gulp-plumber'
import gulpImagemin from 'gulp-imagemin'
import gulpNewer from 'gulp-newer'

import errorHandler from './errorHandler'
import { globs } from '../gulp.config.js'

const fonts = () =>
  gulp
    .src(globs.fonts)
    .pipe(gulpPlumber({ errorHandler }))
    .pipe(gulpNewer('dist/fonts'))
    .pipe(gulp.dest('dist/fonts'))

fonts.displayName = 'fonts'

const images = () =>
  gulp
    .src(globs.images)
    .pipe(gulpPlumber({ errorHandler }))
    .pipe(gulpNewer('dist/images'))
    .pipe(gulpImagemin())
    .pipe(gulp.dest('dist/images'))

images.displayName = 'images'

const media = () =>
  gulp
    .src(globs.media, { base: 'src' })
    .pipe(gulpPlumber({ errorHandler }))
    .pipe(gulpNewer('dist'))
    .pipe(gulp.dest('dist'))

media.displayName = 'media'

export { fonts, images, media }
