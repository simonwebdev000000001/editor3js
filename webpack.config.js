const webpack = require('webpack');
const path = require('path');
const argv = require('yargs').argv;
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isDevelopment = argv.mode === 'development';
const isProduction = !isDevelopment;
const OUT_DIR = 'build';
const distPath = path.join(__dirname, '/'+OUT_DIR);

const config = {
  watchOptions: {
    ignored: [OUT_DIR, 'node_modules']
  },
  devServer: {
    contentBase: path.join(__dirname, ''),
    compress: true,
    hot: true,
    port: 9000
  },
  entry: {
    main: './src/app/index.js'
  },
  output: {
    filename: 'editor3js.js',
    path: distPath
  },
  cache: true,
  devtool:  isProduction?false:'source-map',
  module: {

    rules: [
      // { test: /\.(jpe?g|gif|png|svg|woff|ttf|wav|mp3)$/, loader: "file" },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',

          options: {
            presets: [

              'es2015']
          }
        }
        ]
      }  ,
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              // minimize: isProduction
            }
          },
          'sass-loader',
          'resolve-url-loader'
        ]
      } ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css'
    })
  ],
  optimization: isProduction ? {
    minimizer: [
      new UglifyJsPlugin({
        sourceMap: true,
        uglifyOptions: {
          compress: {
            inline: false,
            warnings: false,
            drop_console: true,
            unsafe: true
          },
        },
      }),
    ],
  } : {}
};

module.exports = config;