const gulp = require('gulp')
const gconcat = require('gulp-concat')
const gdata = require('gulp-data')
const gdebug = require('gulp-debug')
const gfrontMatter = require('gulp-front-matter')
const grename = require('gulp-rename')
const grev = require('gulp-rev')
const gsass = require('gulp-sass')
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

const md = new MarkdownIt({
  html: true,
})
  .use(markdownItFootnote)
  .use(markdownItPrism)

gulp.task('md', () =>
  gulp
    .src('src/content/**/*.md')
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
        var result = md.render(file.contents.toString())
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

gulp.task('js', () =>
  gulp
    .src('src/js/**/*.js')
    .pipe(gconcat('scripts.js'))
    .pipe(gterser())
    .pipe(grev())
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

gulp.task('serve', () =>
  browserSync.init({
    server: 'dist',
  })
)

gulp.task('reload', done => {
  browserSync.reload()
  done()
})

gulp.task('watch', () => {
  gulp.watch('src/css/**/*.scss', gulp.series('css', 'md', 'reload'))
  gulp.watch('src/js/**/*.js', gulp.series('js', 'md', 'reload'))
  gulp.watch('src/content/**/*.md', gulp.series('md', 'reload'))
  gulp.watch('src/templates/**/*.njk', gulp.series('md', 'reload'))
})

gulp.task('clean', () => del(['dist/**/*']))

// Main

gulp.task('build', gulp.series('css', 'js', 'md'))
gulp.task('dev', gulp.series('clean', 'build', gulp.parallel('watch', 'serve')))
