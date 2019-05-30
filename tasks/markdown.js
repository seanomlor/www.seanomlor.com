import _ from 'lodash'
import crypto from 'crypto'
import dayjs from 'dayjs'
import fs from 'fs'
import gulp from 'gulp'
import gulpData from 'gulp-data'
import gulpFrontMatter from 'gulp-front-matter'
import gulpHtmlhint from 'gulp-htmlhint'
import gulpIf from 'gulp-if'
import gulpPlumber from 'gulp-plumber'
import gulpRename from 'gulp-rename'
import gulpTap from 'gulp-tap'
import gulpWrap from 'gulp-wrap'
import MarkdownIt from 'markdown-it'
import markdownItAttrs from 'markdown-it-attrs'
import markdownItNamedHeadings from 'markdown-it-named-headings'
import markdownItBracketedSpans from 'markdown-it-bracketed-spans'
import markdownItFootnote from 'markdown-it-footnote'
import markdownItImplicitFigures from 'markdown-it-implicit-figures'
import markdownItPrism from 'markdown-it-prism'
import path from 'path'

import errorHandler from './errorHandler'
import { globs } from '../gulp.config.js'

const markdownIt = new MarkdownIt({
  html: true,
})
  // disable indentation-based code blocks
  .disable(['code'])
  // support spans via brackets
  // e.g. `hello [foo] bar` => `hello <span>foo</span> bar`
  .use(markdownItBracketedSpans)
  // FIXME: automatically add ids to heading tags
  // breaks when combined with markdownItAttrs
  // .use(markdownItNamedHeadings)
  // support markdown styles
  // e.g. `# hello {.red}` => `<h1 class="red">hello</h1>`
  .use(markdownItAttrs)
  // generate footnotes
  .use(markdownItFootnote)
  // add <figure> around <img> occuring on their own line
  .use(markdownItImplicitFigures)
  // add code highlight classes
  .use(markdownItPrism)

// use bare numbers for footnote refs instead of wrapping in brackets
markdownIt.renderer.rules.footnote_caption = (tokens, idx) => {
  const n = Number(tokens[idx].meta.id + 1).toString()
  return tokens[idx].meta.subId > 0 ? n + ':' + tokens[idx].meta.subId : n
}

// get subresource integrity sha for given asset
// see: https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
const sri = file => {
  const s = fs.readFileSync(file)
  const sha = crypto.createHash('sha384')
  sha.update(s)
  return `sha384-${sha.digest('base64')}`
}

// task:
// - copy raw markdown
// - compile markdown to html with nunjucks template
const markdown = () =>
  gulp
    .src(globs.markdown)
    .pipe(gulpPlumber({ errorHandler }))
    // parse frontmatter into data attribute
    .pipe(gulpFrontMatter({ property: 'data' }))
    // add info about file
    .pipe(
      gulpData(file => {
        const stats = fs.statSync(file.path)
        const createdAt = dayjs(stats.birthtime)
        const updatedAt = dayjs(stats.mtime)

        return {
          createdAt: createdAt.toISOString(),
          createdAtDisplay: createdAt.format('MMMM D, YYYY h:mma'),
          updatedAt: updatedAt.toISOString(),
          updatedAtDisplay: updatedAt.format('MMMM D, YYYY h:mma'),
        }
      })
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
    // change extension to html
    .pipe(gulpRename({ extname: '.html' }))
    /*
      merge additional keys into data attribute:

        1. id: page id
          - 'index.html'      -> 'index'
          - 'foo/index.html'  -> 'foo--index'
          - 'foo/bar.html'    -> 'foo--bar'
          - 'foo/bar/baz.html' -> 'foo--bar--baz'

        2. manifest: parse manifest.json into data.manifest attribute
          'css/main.css': {
            path: '/css/main-5da6bfc502.css',
            hash: 'sha384-+FsvcNcsxdZpZp3gOUkmaU7z2JHHK4KRsDgrG...'
          },
          ...

        3. path: add relative path to data, removing index.html suffix
          - 'index.html'     -> '/'
          - 'foo/index.html' -> '/foo'

    */
    .pipe(
      gulpData(file => ({
        id: path
          .relative('./dist', file.path)
          .replace(/\//, '--')
          .replace(/\.html$/, ''),
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
        path: path
          .join('/', path.relative('./dist', file.path))
          .replace(/^\/index.html$/, '/')
          .replace(/\/index.html$/, ''),
      }))
    )
    // convert markdown to html
    .pipe(
      gulpTap(file => {
        const result = markdownIt.render(file.contents.toString())
        file.contents = Buffer.from(result)
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

markdown.displayName = 'markdown'

export default markdown
