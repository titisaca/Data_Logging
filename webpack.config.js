// eslint-disable-next-line
const path = require('path');
// eslint-disable-next-line
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js', // Your main entry point
  output: {
    filename: 'bundle.js', // Output bundle filename
    path: path.resolve(__dirname, 'dist') // Output directory
  },
  resolve: {
    fallback: {
      fs: false
    }
  },
  node: {
    fs: "empty"
 },
  devtool: 'none', // or false, or any other value that doesn't generate source maps

  plugins: [
    new webpack.IgnorePlugin(/\/src\/xception\/extractParamsFromWeigthMap\.ts$/)
  ]
  // Other configuration options go here
};
