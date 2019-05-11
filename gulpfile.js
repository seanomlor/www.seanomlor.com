const gulp = require('gulp')
const gconcat = require('gulp-concat')
const gdata = require('gulp-data')
const gfrontMatter = require('gulp-front-matter')
const grename = require('gulp-rename')
const grev = require('gulp-rev')
const gsass = require('gulp-sass')
const gsourcemaps = require('gulp-sourcemaps')
const gtap = require('gulp-tap')
const gterser = require('gulp-terser')
const gutil = require('gulp-util')
const gwrap = require('gulp-wrap')
const MarkdownIt = require('markdown-it')
const browserSync = require('browser-sync').create()
const del = require('del')
const fs = require('fs')
const markdownItFootnote = require('markdown-it-footnote')
const markdownItPrism = require('markdown-it-prism')
const path = require('path')

const markdownIt = new MarkdownIt({
  html: true,
})
  .use(markdownItFootnote)
  .use(markdownItPrism)

// just bare numbers for footnote refs
markdownIt.renderer.rules.footnote_caption = (tokens, idx) => {
  const n = Number(tokens[idx].meta.id + 1).toString()
  return tokens[idx].meta.subId > 0 ? n + ':' + tokens[idx].meta.subId : n
}

// task:
// 1. copy raw markdown
// 2. compile markdown to html with nunjucks template
gulp.task('md', () =>
  gulp
    .src('src/content/**/*.md')
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
    .pipe(gulp.dest('dist'))
)

// task: compile sass
gulp.task('css', () =>
  gulp
    .src('src/css/**/*.+(scss|css)')
    .pipe(
      gsass({
        outputStyle: 'compressed',
      }).on('error', gsass.logError)
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
    .pipe(gsourcemaps.init())
    .pipe(gconcat('scripts.js'))
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
        // serve *.md from dist as text/plain
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
  gulp.watch('src/css/**/*.scss', gulp.series('css', 'md', 'reload'))
  gulp.watch('src/js/**/*.js', gulp.series('js', 'md', 'reload'))
  gulp.watch('src/content/**/*.md', gulp.series('md', 'reload'))
  gulp.watch('src/templates/**/*.njk', gulp.series('md', 'reload'))
})

// task: empty dist
gulp.task('clean', () => del(['dist/**/*']))

// task: build site
gulp.task('build', gulp.series('css', 'js', 'md'))

// task: develop
gulp.task('dev', gulp.series('clean', 'build', gulp.parallel('watch', 'serve')))
