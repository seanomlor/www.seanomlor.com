const gulp = require('gulp')
const gconcat = require('gulp-concat')
const gdata = require('gulp-data')
const geslint = require('gulp-eslint')
const gfrontMatter = require('gulp-front-matter')
const ghtmlhint = require('gulp-htmlhint')
const gimagemin = require('gulp-imagemin')
const gnewer = require('gulp-newer')
const gnotify = require('gulp-notify')
const gplumber = require('gulp-plumber')
const gpostcss = require('gulp-postcss')
const grename = require('gulp-rename')
const grev = require('gulp-rev')
const gsass = require('gulp-sass')
const gsourcemaps = require('gulp-sourcemaps')
const gstylelint = require('gulp-stylelint')
const gtap = require('gulp-tap')
const gterser = require('gulp-terser')
const gutil = require('gulp-util')
const gwrap = require('gulp-wrap')
const autoprefixer = require('autoprefixer')
const browserSync = require('browser-sync').create()
const del = require('del')
const fs = require('fs')
const MarkdownIt = require('markdown-it')
const markdownItAttrs = require('markdown-it-attrs')
const markdownItBracketedSpans = require('markdown-it-bracketed-spans')
const markdownItFootnote = require('markdown-it-footnote')
const markdownItPrism = require('markdown-it-prism')
const path = require('path')
const postcssClean = require('postcss-clean')
const postcssReporter = require('postcss-reporter')

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
  gnotify.onError({
    title: 'Gulp error in ' + err.plugin,
    message: err.toString(),
  })(err)
  gutil.beep()
  this.emit('end')
}

// task: copy fonts
gulp.task('fonts', () =>
  gulp
    .src('src/fonts/**/*')
    .pipe(gnewer('dist/fonts'))
    .pipe(gulp.dest('dist/fonts'))
)

// task: optimize and copy images
gulp.task('images', () =>
  gulp
    .src('src/images/**/*')
    .pipe(gnewer('dist/images'))
    .pipe(gimagemin())
    .pipe(gulp.dest('dist/images'))
)

// task:
// 1. copy raw markdown
// 2. compile markdown to html with nunjucks template
gulp.task('md', () =>
  gulp
    .src('src/content/**/*.md')
    .pipe(gplumber({ errorHandler }))
    .pipe(gulp.dest('dist'))
    .pipe(gfrontMatter({ property: 'data' }))
    .pipe(
      // include parsed manifest in data
      gdata(_file => ({
        assets: JSON.parse(fs.readFileSync('dist/manifest.json')),
      }))
    )
    .pipe(
      // convert markdown to html
      gtap(file => {
        const result = markdownIt.render(file.contents.toString())
        file.contents = Buffer.from(result)
        file.path = gutil.replaceExtension(file.path, '.html')
        return file
      })
    )
    .pipe(
      gwrap(
        // get template from layout attribute, default to index.njk
        data => {
          const template = `${path.parse(data.layout || 'index').name}.njk`
          return fs.readFileSync(`src/templates/${template}`).toString()
        },
        null,
        { engine: 'nunjucks' }
      )
    )
    .pipe(ghtmlhint())
    .pipe(ghtmlhint.reporter('htmlhint-stylish'))
    .pipe(gulp.dest('dist'))
)

// task: compile sass
gulp.task('css', () =>
  gulp
    .src('src/css/**/*.+(scss|css)')
    .pipe(gplumber({ errorHandler }))
    .pipe(gsass({ outputStyle: 'expanded' }))
    .pipe(
      gpostcss([
        postcssReporter({ clearReportedMessages: true }),
        autoprefixer,
        postcssClean,
      ])
    )
    .pipe(
      gstylelint({
        failAfterError: false,
        reporters: [{ formatter: 'verbose', console: true }],
      })
    )
    .pipe(grev())
    .pipe(gulp.dest('dist/css'))
    .pipe(grename({ dirname: 'css' }))
    .pipe(
      grev.manifest('dist/manifest.json', {
        base: 'dist',
        merge: true,
      })
    )
    .pipe(gulp.dest('dist'))
)

// compile javascript
gulp.task('js', () =>
  gulp
    .src('src/js/**/*.js')
    .pipe(gplumber({ errorHandler }))
    .pipe(gsourcemaps.init())
    .pipe(gconcat('scripts.js'))
    .pipe(geslint())
    .pipe(geslint.format())
    .pipe(gterser())
    .pipe(grev())
    .pipe(gsourcemaps.write('.'))
    .pipe(gulp.dest('dist/js'))
    .pipe(grename({ dirname: 'js' }))
    .pipe(
      grev.manifest('dist/manifest.json', {
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
