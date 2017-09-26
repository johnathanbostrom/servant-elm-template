`use strict`
// npm run-script build -> Production
// npm start -> Development
const PRODUCTION = process.env.npm_lifecycle_event === 'build';
const DEVELOPMENT = !PRODUCTION;
const ELM_DEBUG = DEVELOPMENT ? 'true' : 'false'
const Path = require('path');
const Webpack = require('webpack');
const WepackMd5Hash = require('webpack-md5-hash');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Autoprefixer = require('autoprefixer');
const _ = require('lodash');

const OutputPath = Path.join(__dirname, '/dist');
const ElmStuffPath = Path.join(__dirname, '/elm-stuff');
const ScriptsPath = Path.join(__dirname, '/static/lib/scripts');
const NodeModulesPath = Path.join(__dirname, '/node_modules');
const StaticPath = Path.join(__dirname, '/static');
const PublicPath = Path.join(__dirname, '/dist/static');

const OnlyIn = (test, thing) => {
    if (test) return thing;
}

const IfDevelopment = (thing, other) => {
    return DEVELOPMENT ? thing : other
}

module.exports = {
    devtool: IfDevelopment('eval-source-map', 'cheap-module-source-map'),

    entry: {
        main: _.compact([
            OnlyIn(DEVELOPMENT, 'webpack-hot-middleware/client'),
            'babel-polyfill',
            `${StaticPath}/index.ts`
        ])
    },

    output: {
        filename: IfDevelopment('[name].js', '[name].[chunkhash].js'),
        path: OutputPath,
        publicPath: PublicPath
    },

    resolve: {
        modules: ['node_modules', StaticPath],
        extensions: ['.js', '.elm', '.css', '.scss', '.ts']
    },

    module: {
        rules: [{
           test: /\.js$/,
           exclude: /(node_modules|\.min\.|elm-stuff)/,
           use: ['babel-loader'],
        }, {
            test: /\.ts$/,
            exclude: /(node_modules|\.min\.|elm-stuff)/,
            use: ['ts-loader'],
         }, {
           test: /(\.css)$/,
           use: ['style-loader', 'css-loader']
        }, {
            test: /\.sc?ss$/,
            use: ['style-loader', 'css-loader', 'sass-loader']
        }, {
           test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
           use: ['url-loader?limit=65000&mimetype=application/font-woff&name=assets/fonts/[name].[ext]'],
        }, {
           test: /\.(html|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
           use: 'file-loader',
        }, {
           test: /\.elm$/,
           use: _.compact([
              OnlyIn(DEVELOPMENT, 'elm-hot-loader'),
              `elm-webpack-loader?debug=${ELM_DEBUG}`,
           ]),
        }],

        noParse: /\.elm/,
     },

     plugins: _.compact([
        OnlyIn(DEVELOPMENT, new Webpack.HotModuleReplacementPlugin()),

        new Webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        }),

        new Webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            moment: 'moment'
        }),

        // Outputs main.css in production
        OnlyIn(PRODUCTION, new ExtractTextPlugin('[name].[contenthash].css')),

        OnlyIn(PRODUCTION, new Webpack.optimize.UglifyJsPlugin({ sourceMap: true, compress: {warnings: true }})),

        new Webpack.NoEmitOnErrorsPlugin(),

        // Remove build directory
        OnlyIn(PRODUCTION, new CleanWebpackPlugin([OutputPath])),

        new CopyWebpackPlugin([{
            from: 'assets/',
            to: 'assets/'
        }]),

        OnlyIn(PRODUCTION, new WepackMd5Hash()),

    ]),

    devServer: {
        inline: true,
        host: 'localhost',
        port: 7000,
        hot: true,
        disableHostCheck: true,
        historyApiFallback: true,
        stats: {
          colors: true,
          chunks: false,
        },
        proxy: {
          '/servant-elm-template/*': {
            target: 'http://localhost:3000',
            changeOrigin: true,
          },
        },
      },
};