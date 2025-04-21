/**
 * Webpack conflation for development sever.
 * 
 * Code in ./dev directory
 * Run the server using `npm run dev`
 */
// 

const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('node:path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: './dev/index.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dev-dist'),
  },
  resolve: {
    // `emojilib` require .json extension to works
    extensions: ['.ts', '.js', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        use: 'html-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './dev/index.html',
      minify: {
        collapseWhitespace: true,
        collapseInlineTagWhitespace: true,
      },
    }),
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dev-dist'),
    },
    port: 8080,
  },
  mode: 'development',
};
