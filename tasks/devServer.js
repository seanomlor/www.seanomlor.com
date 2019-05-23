import { create as browserSyncCreate } from 'browser-sync'

const browserSync = browserSyncCreate()

const startServer = () =>
  browserSync.init({
    server: 'dist',
    callbacks: {
      ready: (_err, bs) => {
        // serve *.md files as text/plain
        bs.utils.serveStatic.mime.define({
          'text/plain': ['md'],
          'application/manifest+json': ['webmanifest'],
        })
      },
    },
  })

startServer.displayName = 'startServer'

const reloadServer = done => {
  browserSync.reload()
  done()
}

reloadServer.displayName = 'reloadServer'

export { startServer, reloadServer }
