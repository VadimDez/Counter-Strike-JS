/**
 * Created by Vadym Yatsyuk on 25.02.18
 */
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

var config = {
  entry: [
    // 'webpack-dev-server/client?http://0.0.0.0:9000',
    // 'webpack/hot/only-dev-server',
    './src/app.ts',
  ],
  output: {
    filename: 'bundle.js',
    path: __dirname,
  },
  devServer: {
    static: {
      directory: __dirname,
    },
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || 9000,
    open: true, // open page in browser
  },
  module: {
    rules: [
      // commented for now due to issue with webpack 4
      // {
      //   test: /\.tsx?$/,
      //   enforce: 'pre',
      //   loader: 'tslint-loader',
      //   options: {
      //     configFile: 'tslint.json'
      //   }
      // },
      {
        test: /\.scss$/,
        use: [
          'style-loader', // creates style nodes from JS strings
          'css-loader', // translates CSS into CommonJS
          'sass-loader', // compiles Sass to CSS, using Node Sass by default
        ],
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    //   new HtmlWebpackPlugin({
    //     template: './index.html'
    //   })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};

module.exports = config;
