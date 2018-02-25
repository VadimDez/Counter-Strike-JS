/**
 * Created by Vadym Yatsyuk on 25.02.18
 */
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

var config = {
  entry: [
    'webpack-dev-server/client?http://0.0.0.0:9000',
    'webpack/hot/only-dev-server',
    './src/app.ts'
  ],
  output: {
    filename: 'bundle.js',
    path: __dirname
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
  //   new HtmlWebpackPlugin({
  //     template: './index.html'
  //   })
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  }
};


module.exports = config;