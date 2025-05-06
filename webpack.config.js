const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    background: './src/background/index.js',
    content: './src/content/index.js',
    popup: './src/popup/index.js'
  },
  output: {
    filename: 'js/[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: ''
  },
  experiments: {
    asyncWebAssembly: true // Required for OpenCV.js
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[hash][ext][query]'
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '' },
        { from: 'src/lib/opencv.js', to: 'lib' },
        { from: 'src/popup/popup.html', to: '' },
        {
          from: path.resolve(__dirname, 'node_modules/@techstark/opencv-js/dist/opencv.js'),
          to: 'lib/opencv.js'
        }
      ]
    })
  ],
  devtool: 'cheap-module-source-map',
  // optimization: {
  //   splitChunks: {
  //     chunks: 'all',
  //     cacheGroups: {
  //       vendors: {
  //         test: /[\\/]node_modules[\\/]/,
  //         priority: -10
  //       }
  //     }
  //   },
  //   runtimeChunk: 'single'
  // },
  resolve: {
    alias: {
      '@babel/runtime': path.resolve(__dirname, 'node_modules/@babel/runtime'),
      '@techstark/opencv-js': path.resolve(
        __dirname,
        'node_modules/@techstark/opencv-js/dist/opencv.js'
      )
    },
    fallback: {
      fs: false,
      path: false,
      crypto: false
    }
  },
  target: 'web',
  devtool: 'inline-source-map'
}
