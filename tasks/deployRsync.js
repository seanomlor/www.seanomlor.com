import _ from 'lodash'
import gulp from 'gulp'
import gulpNoop from 'gulp-noop'
import gulpRsync from 'gulp-rsync'
import inquirer from 'inquirer'
import PluginError from 'plugin-error'

const deployRsync = done => {
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
}

deployRsync.displayName = 'deployRsync'

export default deployRsync
