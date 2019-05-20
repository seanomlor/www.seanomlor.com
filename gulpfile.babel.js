import _ from 'lodash'
import autoprefixer from 'autoprefixer'
import crypto from 'crypto'
import del from 'del'
import fs from 'fs'
import gulp from 'gulp'
import gulpData from 'gulp-data'
import gulpFrontMatter from 'gulp-front-matter'
import gulpHtmlhint from 'gulp-htmlhint'
import gulpIf from 'gulp-if'
import gulpImagemin from 'gulp-imagemin'
import gulpNewer from 'gulp-newer'
import gulpNoop from 'gulp-noop'
import gulpNotify from 'gulp-notify'
import gulpPlumber from 'gulp-plumber'
import gulpPostcss from 'gulp-postcss'
import gulpRename from 'gulp-rename'
import gulpRev from 'gulp-rev'
import gulpRsync from 'gulp-rsync'
import gulpSass from 'gulp-sass'
import gulpStylelint from 'gulp-stylelint'
import gulpTap from 'gulp-tap'
import gulpWrap from 'gulp-wrap'
import inquirer from 'inquirer'
import MarkdownIt from 'markdown-it'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItNamedHeadings from 'markdown-it-named-headings'
import markdownItBracketedSpans from 'markdown-it-bracketed-spans'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItPrism from 'markdown-it-prism'
import PluginError from 'plugin-error'
import path from 'path'
import postcssClean from 'postcss-clean'
import postcssReporter from 'postcss-reporter'
import { create as browserSyncCreate } from 'browser-sync'
import webpack from 'webpack'
import webpackStream from 'webpack-stream'
import webpackConfigCreate from './webpack.config.js'

const browserSync = browserSyncCreate()

const markdownIt = new MarkdownIt({
  html: true,
})
  // disable indentation-based code blocks
  .disable(['code'])
  // support spans via brackets
  // e.g. `hello [foo] bar` => `hello <span>foo</span> bar`
  .use(markdownItBracketedSpans)
  // automatically add ids to heading tags
  .use(markdownItNamedHeadings)
  // support markdown styles
  // e.g. `# hello {.red}` => `<h1 class="red">hello</h1>`
  .use(markdownItAttrs)
  // generate footnotes
  .use(markdownItFootnote)
  // add code highlight classes
  .use(markdownItPrism)

const webpackConfig = webpackConfigCreate(process.env)

// use bare numbers for footnote refs instead of wrapping in brackets
markdownIt.renderer.rules.footnote_caption = (tokens, idx) => {
  const n = Number(tokens[idx].meta.id + 1).toString()
  return tokens[idx].meta.subId > 0 ? n + ':' + tokens[idx].meta.subId : n
}

// gulp-plumber error handler to trigger system notification
// note: need `this` to emit end ಠ_ಠ
const errorHandler = function(err) {
  gulpNotify.onError({
    title: 'Gulp error in ' + err.plugin,
    message: err.messageOriginal || err.message,
  })(err)
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
    .src('src/content/**/*.md?(.njk)')
    .pipe(gulpPlumber({ errorHandler }))
    // parse frontmatter into data attribute
    .pipe(gulpFrontMatter({ property: 'data' }))
    // parse manifest.json into data.manifest attribute
    //   {
    //     'css/main.css': {
    //       path: '/css/main-5da6bfc502.css',
    //       hash: 'sha384-+FsvcNcsxdZpZp3gOUkmaU7z2JHHK4KRsDgrG...'
    //    },
    //    ...
    .pipe(
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
    // pre-process *.md.njk as nunjucks
    .pipe(
      gulpIf(
        file => file.extname === '.njk',
        gulpWrap(data => data.file.contents.toString(), null, {
          engine: 'nunjucks',
        })
      )
    )
    // remove .njk extensions
    .pipe(
      gulpRename(path => {
        if (path.extname === '.njk') {
          path.extname = '.md'
          path.basename = path.basename.split('.md')[0]
        }
      })
    )
    // copy markdown as-is to dist now
    .pipe(gulp.dest('dist'))
    // convert markdown to html
    .pipe(
      gulpTap(file => {
        const result = markdownIt.render(file.contents.toString())
        file.contents = Buffer.from(result)
        file.extname = '.html'
        return file
      })
    )
    // wrap with nunjucks template from data.layout, default index.njk
    .pipe(
      gulpWrap(
        data => {
          const template = `${path.parse(data.layout || 'default').name}.njk`
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

// task: compile javascript via webpack
gulp.task('js', () =>
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
  gulp.watch('src/content/**/*.md?(.njk)', gulp.series('md', 'reload'))
  gulp.watch('src/css/**/*.scss', gulp.series('css', 'md', 'reload'))
  gulp.watch('src/fonts/**/*', gulp.series('fonts', 'reload'))
  gulp.watch('src/images/**/*', gulp.series('images', 'reload'))
  gulp.watch('src/js/**/*.js', gulp.series('js', 'md', 'reload'))
  gulp.watch('src/templates/**/*.njk', gulp.series('md', 'reload'))
})

// task: empty dist
gulp.task('clean', () => del(['dist/**/*']))

// task: build site
gulp.task('build', gulp.series('clean', 'fonts', 'images', 'css', 'js', 'md'))

// task: deploy via rsync
gulp.task('deploy:rsync', done => {
  const env = process.env.NODE_ENV
  const hostname = process.env.RSYNC_HOSTNAME
  const destination = process.env.RSYNC_DESTINATION

  if (_.some([hostname, destination], _.negate(_.isString))) {
    throw new PluginError({
      plugin: 'deploy',
      message: 'missing hostname or destination',
      showProperties: false,
    })
  }

  inquirer
    .prompt([
      {
        type: 'confirm',
        name: 'confirm',
        default: false,
        message: `
      Are you SURE you want to deploy to ${env}?
      hostname: ${hostname}
      destination: ${destination}
      `,
      },
    ])
    .then(res =>
      res.confirm
        ? gulp
            .src('dist')
            .pipe(
              gulpRsync({
                hostname,
                destination,
                root: 'dist',
                progress: true,
                incremental: true,
                recursive: true,
                verbose: true,
                clean: true,
              })
            )
            .pipe(gulpNoop())
            .on('finish', done)
        : done()
    )
})

// task: deploy
gulp.task('deploy', gulp.series('build', 'deploy:rsync'))

// task: develop
gulp.task('dev', gulp.series('build', gulp.parallel('watch', 'serve')))
