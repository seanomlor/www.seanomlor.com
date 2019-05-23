const globs = {
  dist: 'dist/**/*',
  fonts: 'src/fonts/**/*',
  images: 'src/images/**/*',
  markdown: 'src/content/**/*.md?(.njk)',
  media: [
    'src/*.ico',
    'src/*.txt',
    'src/android-*.png',
    'src/apple-*.png',
    'src/favicon-*.png',
    'src/site.webmanifest',
    'src/media/**/*',
  ],
  scripts: 'src/js/**/*.js',
  styles: 'src/css/**/*.+(scss|css)',
  templates: 'src/templates/**/*.njk',
}

export { globs }
