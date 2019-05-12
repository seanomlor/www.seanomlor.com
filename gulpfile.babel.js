'use strict'

import _ from 'lodash'
import autoprefixer from 'autoprefixer'
import crypto from 'crypto'
import del from 'del'
import fs from 'fs'
import gulp from 'gulp'
import gulpData from 'gulp-data'
import gulpEslint from 'gulp-eslint'
import gulpFrontMatter from 'gulp-front-matter'
import gulpHtmlhint from 'gulp-htmlhint'
import gulpImagemin from 'gulp-imagemin'
import gulpNewer from 'gulp-newer'
import gulpNotify from 'gulp-notify'
import gulpPlumber from 'gulp-plumber'
import gulpPostcss from 'gulp-postcss'
import gulpRename from 'gulp-rename'
import gulpRev from 'gulp-rev'
import gulpSass from 'gulp-sass'
import gulpSourcemaps from 'gulp-sourcemaps'
import gulpStylelint from 'gulp-stylelint'
import gulpTap from 'gulp-tap'
import gulpUtil from 'gulp-util'
import gulpWrap from 'gulp-wrap'
import MarkdownIt from 'markdown-it'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItBracketedSpans from 'markdown-it-bracketed-spans'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItPrism from 'markdown-it-prism'
import path from 'path'
import postcssClean from 'postcss-clean'
import postcssReporter from 'postcss-reporter'
import { create as browserSyncCreate } from 'browser-sync'
import webpack from 'webpack'
import webpackStream from 'webpack-stream'
import webpackConfig from './webpack.config.js'

const browserSync = browserSyncCreate()

const markdownIt = new MarkdownIt({
  html: true,
})
  // support spans via brackets
  // e.g. `hello [foo] bar` => `hello <span>foo</span> bar`
  .use(markdownItBracketedSpans)
  // support markdown styles
  // e.g. `# hello {.red}` => `<h1 class="red">hello</h1>`
  .use(markdownItAttrs)
  // generate footnotes
  .use(markdownItFootnote)
  // add code highlight classes
  .use(markdownItPrism)

// use bare numbers for footnote refs instead of wrapping in brackets
markdownIt.renderer.rules.footnote_caption = (tokens, idx) => {
  const n = Number(tokens[idx].meta.id + 1).toString()
  return tokens[idx].meta.subId > 0 ? n + ':' + tokens[idx].meta.subId : n
}

// gulp-plumber handler to trigger notification and beep
// function format to capture `this` ಠ_ಠ
const errorHandler = function(err) {
  gulpNotify.onError({
    title: 'Gulp error in ' + err.plugin,
    message: err.messageOriginal || err.message,
  })(err)
  gulpUtil.beep()
  this.emit('end')
}

// get subresource integrity sha for given asset
// see: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
const sri = file => {
  const s = fs.readFileSync(file)
  const sha = crypto.createHash('sha384')
  sha.update(s)
  return `sha384-${sha.digest('base64')}`
}

// task: copy fonts
gulp.task('fonts', () =>
  gulp
    .src('src/fonts/**/*')
    .pipe(gulpNewer('dist/fonts'))
    .pipe(gulp.dest('dist/fonts'))
)

// task: optimize and copy images
gulp.task('images', () =>
  gulp
    .src('src/images/**/*')
    .pipe(gulpNewer('dist/images'))
    .pipe(gulpImagemin())
    .pipe(gulp.dest('dist/images'))
)

// task:
// 1. copy raw markdown
// 2. compile markdown to html with nunjucks template
gulp.task('md', () =>
  gulp
    .src('src/content/**/*.md')
    .pipe(gulpPlumber({ errorHandler }))
    .pipe(gulp.dest('dist'))
    .pipe(gulpFrontMatter({ property: 'data' }))
    .pipe(
      // parse dist/manifest.json and return manifest data for use in templates:
      //   {
      //     manifest: {
      //       'css/main.css': {
      //         path: '/css/main-5da6bfc502.css',
      //         hash: 'sha384-+FsvcNcsxdZpZp3gOUkmaU7z2JHHK4KRsDgrG...'
      //      },
      //      ...
      //     }
      //   }
      gulpData(_file => ({
        manifest: _.reduce(
          JSON.parse(fs.readFileSync('dist/manifest.json')),
          (accum, path, asset) => ({
            ...accum,
            [asset]: {
              path: `/${path}`,
              hash: sri(`dist/${path}`),
            },
          }),
          {}
        ),
      }))
    )
    .pipe(
      // convert markdown to html
      gulpTap(file => {
        const result = markdownIt.render(file.contents.toString())
        file.contents = Buffer.from(result)
        file.path = gulpUtil.replaceExtension(file.path, '.html')
        return file
      })
    )
    .pipe(
      gulpWrap(
        // get template from layout attribute, default to index.njk
        data => {
          const template = `${path.parse(data.layout || 'page').name}.njk`
          return fs.readFileSync(`src/templates/${template}`).toString()
        },
        null,
        { engine: 'nunjucks' }
      )
    )
    .pipe(gulpHtmlhint())
    .pipe(gulpHtmlhint.reporter('htmlhint-stylish'))
    .pipe(gulp.dest('dist'))
)

// task: compile sass
gulp.task('css', () =>
  gulp
    .src('src/css/**/*.+(scss|css)')
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
)

// compile javascript
gulp.task('js', () =>
  gulp
    .src('src/js/index.js')
    .pipe(gulpPlumber({ errorHandler }))
    .pipe(gulpSourcemaps.init())
    .pipe(
      webpackStream(webpackConfig),
      webpack
    )
    .pipe(gulpEslint())
    // .pipe(gulpEslint.format())
    .pipe(gulpRev())
    .pipe(gulpSourcemaps.write('.'))
    .pipe(gulp.dest('dist/js'))
    .pipe(gulpRename({ dirname: 'js' }))
    .pipe(
      gulpRev.manifest('dist/manifest.json', {
        base: 'dist',
        merge: true,
      })
    )
    .pipe(gulp.dest('dist'))
)

// task: dev server
gulp.task('serve', () =>
  browserSync.init({
    server: 'dist',
    callbacks: {
      ready: (_err, bs) => {
        // serve *.md files as text/plain
        bs.utils.serveStatic.mime.define({ 'text/plain': ['md'] })
      },
    },
  })
)

// task: refresh dev server
gulp.task('reload', done => {
  browserSync.reload()
  done()
})

// task: watch src, trigger build and reload
gulp.task('watch', () => {
  gulp.watch('src/content/**/*.md', gulp.series('md', 'reload'))
  gulp.watch('src/css/**/*.scss', gulp.series('css', 'md', 'reload'))
  gulp.watch('src/fonts/**/*', gulp.series('fonts', 'reload'))
  gulp.watch('src/images/**/*', gulp.series('images', 'reload'))
  gulp.watch('src/js/**/*.js', gulp.series('js', 'md', 'reload'))
  gulp.watch('src/templates/**/*.njk', gulp.series('md', 'reload'))
})

// task: empty dist
gulp.task('clean', () => del(['dist/**/*']))

// task: build site
gulp.task('build', gulp.series('fonts', 'images', 'css', 'js', 'md'))

// task: develop
gulp.task('dev', gulp.series('clean', 'build', gulp.parallel('watch', 'serve')))
