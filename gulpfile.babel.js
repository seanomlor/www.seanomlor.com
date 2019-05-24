import { forEach } from 'lodash'
import del from 'del'
import gulp from 'gulp'

import { globs } from './gulp.config'
import { favicons, fonts, images, media } from './tasks/media'
import { startServer, reloadServer } from './tasks/devServer'
import deployRsync from './tasks/deployRsync'
import markdown from './tasks/markdown'
import scripts from './tasks/scripts'
import styles from './tasks/styles'

const clean = done => {
  del(globs.dist)
  done()
}

const build = gulp.series(
  clean,
  favicons,
  fonts,
  images,
  media,
  scripts,
  styles,
  markdown
)

const watch = done => {
  gulp.watch(globs.favicon, gulp.series(favicons, reloadServer))
  gulp.watch(globs.fonts, gulp.series(fonts, reloadServer))
  gulp.watch(globs.images, gulp.series(images, reloadServer))
  gulp.watch(globs.markdown, gulp.series(markdown, reloadServer))
  gulp.watch(globs.media, gulp.series(media, reloadServer))
  gulp.watch(globs.scripts, gulp.series(scripts, markdown, reloadServer))
  gulp.watch(globs.styles, gulp.series(styles, markdown, reloadServer))
  gulp.watch(globs.templates, gulp.series(markdown, reloadServer))
  done()
}

const deploy = gulp.series(build, deployRsync)

const dev = gulp.series(build, gulp.parallel(watch, startServer))

forEach({ clean, build, watch, deploy, dev }, (f, k) => {
  f.displayName = k
})

export { build, clean, deploy, dev, favicons }
