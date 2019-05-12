module.exports = env => ({
  devtool: env.NODE_ENV === 'development' ? 'eval' : false,
  mode: env.NODE_ENV,
  output: {
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: ['babel-loader', 'eslint-loader'],
      },
    ],
  },
})
