import gulpNotify from 'gulp-notify'

// gulp-plumber error handler to trigger system notification
// note: need `this` to emit end ಠ_ಠ
const errorHandler = function(err) {
  gulpNotify.onError({
    title: 'Gulp error in ' + err.plugin,
    message: err.messageOriginal || err.message,
  })(err)
  this.emit('end')
}

export default errorHandler
