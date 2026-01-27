require('./builder/defaultBuildEnv');
const {DefinePlugin, ProvidePlugin} = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const outputPath = BUILD_ENV.outputPath;
const mode = BUILD_ENV.mode;
const devtool = BUILD_ENV.devtool;
const babelEnvOptions = BUILD_ENV.babelEnvOptions;
const browser = BUILD_ENV.browser;

const config = {
  entry: {
    bg: './src/bg/bg',
    index: './src/pages/index',
    options: './src/pages/Options',
    tabUrlFetch: './src/tabUrlFetch',
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
    path: path.join(outputPath, 'src'),
    clean: false,
  },
  mode: mode,
  devtool: devtool,
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          name: "commons",
          chunks: chunk => ['index', 'options'].includes(chunk.name),
          minChunks: 2,
          priority: 10,
        },
        commons_ui: {
          name: "commons-ui",
          chunks: chunk => ['index', 'options'].includes(chunk.name),
          minChunks: 2,
          priority: 5,
        },
      }
    },
    minimizer: [
      '...',
      new CssMinimizerPlugin(),
    ],
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              ['@babel/plugin-proposal-decorators', {'legacy': true}],
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-proposal-class-properties',
              ...(mode === 'production' ? [['transform-react-remove-prop-types', {removeImport: true}]] : [])
            ],
            presets: [
              '@babel/preset-react',
              ['@babel/preset-env', babelEnvOptions],
              ['@babel/preset-typescript', {isTSX: true, allExtensions: true}]
            ]
          }
        }
      },
      {
        test: /\.(css|scss|sass)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(gif|png|svg)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8192
          }
        }
      },
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    fallback: {
      "path": require.resolve("path-browserify"),
      "url": require.resolve("url/"),
      "querystring": require.resolve("querystring-es3"),
      "util": require.resolve("util/"),
      "process": require.resolve("process/browser.js"),
    },
    alias: {
      "process/browser": require.resolve("process/browser.js"),
    }
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
      cleanOnceBeforeBuildPatterns: [
        outputPath,
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './src/manifest.json',
          transform: (content) => {
            const manifest = JSON.parse(content);
            if (browser === 'firefox') {
              // Firefox V3: add gecko settings, remove Chrome-specific
              delete manifest.minimum_chrome_version;
              manifest.browser_specific_settings = {
                gecko: {
                  strict_min_version: '109.0'
                }
              };
            }
            return JSON.stringify(manifest, null, 4);
          }
        },
        {from: './src/assets/icons', to: './assets/icons'},
        {from: './src/assets/img/notification_*.png', to: './assets/img/[name][ext]'},
        {from: './src/_locales', to: './_locales'},
      ]
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[name].chunk.css'
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/templates/index.html',
      chunks: ['commons', 'commons-ui', 'index'],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new HtmlWebpackPlugin({
      filename: 'options.html',
      template: './src/templates/options.html',
      chunks: ['commons', 'commons-ui', 'options'],
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    new DefinePlugin({
      'BUILD_ENV': Object.entries(BUILD_ENV).reduce((obj, [key, value]) => {
        obj[key] = JSON.stringify(value);
        return obj;
      }, {}),
    }),
    new ProvidePlugin({
      process: 'process/browser',
    }),
  ]
};

module.exports = config;
