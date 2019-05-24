import gulp from 'gulp'
import gulpFavicons from 'gulp-favicons'
import gulpPlumber from 'gulp-plumber'
import gulpImagemin from 'gulp-imagemin'
import gulpNewer from 'gulp-newer'

import errorHandler from './errorHandler'
import { globs } from '../gulp.config.js'

const favicons = () =>
  gulp
    .src(globs.favicon)
    .pipe(gulpPlumber({ errorHandler }))
    .pipe(
      gulpFavicons({
        icons: {
          favicons: true,
          android: false,
          appleIcon: false,
          appleStartup: false,
          coast: false,
          firefox: false,
          windows: false,
          yandex: false,
        },
        logging: true,
        pipeHTML: false,
        replace: true,
      })
    )
    .pipe(gulp.dest('dist'))

favicons.displayName = 'favicons'

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

export { favicons, fonts, images, media }
