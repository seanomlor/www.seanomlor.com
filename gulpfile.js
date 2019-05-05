const gulp = require('gulp')
const gconcat = require('gulp-concat')
const gdebug = require('gulp-debug')
const gfrontMatter = require('gulp-front-matter')
const glayout = require('layout1')
const gsass = require('gulp-sass')
const gsourcemaps = require('gulp-sourcemaps')
const gconnect = require('gulp-connect')
const gtap = require('gulp-tap')
const gterser = require('gulp-terser')
const gutil = require('gulp-util')
const del = require('del')
const markdownItFootnote = require('markdown-it-footnote')
const markdownItPrism = require('markdown-it-prism')
const MarkdownIt = require('markdown-it')

const md = new MarkdownIt({
  html: true,
})
  .use(markdownItFootnote)
  .use(markdownItPrism)

const markdownToHtml = file => {
  var result = md.render(file.contents.toString())
  file.contents = Buffer.from(result)
  file.path = gutil.replaceExtension(file.path, '.html')
  return file
}

// get template from frontmatter layout attribute, else default to index.njk
const getTemplate = file => `src/templates/${file.data.layout || 'index'}.njk`

gulp.task('md', () =>
  gulp
    .src('./src/content/**/*.md')
    .pipe(gfrontMatter({ property: 'data' }))
    .pipe(gtap(markdownToHtml))
    .pipe(glayout.nunjucks(getTemplate))
    .pipe(gulp.dest('./dist'))
    .pipe(gconnect.reload())
)

gulp.task('css', () =>
  gulp
    .src('./src/css/**/*.+(scss|css)')
    .pipe(
      gsass({
        outputStyle: 'compressed',
      }).on('error', gsass.logError)
    )
    .pipe(gulp.dest('./dist/css'))
    .pipe(gconnect.reload())
)

gulp.task('js', () =>
  gulp
    .src('./src/js/**/*.js')
    .pipe(gsourcemaps.init())
    .pipe(gconcat('scripts.js'))
    .pipe(gterser())
    .pipe(gsourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js'))
    .pipe(gconnect.reload())
)

gulp.task('serve', () =>
  gconnect.server({
    root: 'dist',
    livereload: true,
    port: 5001,
  })
)

gulp.task('clean', () => del(['dist/**/*']))

gulp.task('watch', () => {
  gulp.watch('./src/css/**/*.scss', gulp.parallel('css'))
  gulp.watch('./src/js/**/*.js', gulp.parallel('js'))
  gulp.watch('./src/(content|templates)/**/*.(md|njk)', gulp.parallel('md'))
})

gulp.task('build', gulp.parallel('md', 'css', 'js'))

gulp.task('dev', gulp.series('clean', 'build', gulp.parallel('watch', 'serve')))
