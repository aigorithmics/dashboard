'use strict';
import ESLintPlugin from 'eslint-webpack-plugin';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';
import webpack from 'webpack';
import version from './package.json' with { type: "json" };
let commit = process.env.BUILD_COMMIT || '';
const __dirname = import.meta.dirname;

try {
    commit = commit || `${execSync(`git rev-parse HEAD`)}`.replace(/\s/g, '');
} catch (e) {}

const ENV = process.env.NODE_ENV || 'development';
const NODE_MODULES = /\/node_modules\//;
const PKG_VERSION =
    `${version}-${commit.slice(0, 6)}`;
const BUILD_VERSION = process.env.BUILD_VERSION || `dev_local`;
const SRC = resolve(__dirname, 'public');
const DESTINATION = resolve(__dirname, 'dist', 'public');

export default {
    mode: ENV,
    entry: {
        dashboard_lib: resolve(SRC, 'library.js'),
    },
    output: {
        filename: '[name].bundle.js',
        path: DESTINATION,
        library: 'centraldashboard',
        libraryTarget: 'umd',
    },
    devtool: 'cheap-source-map',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: NODE_MODULES,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        presets: [[
                            '@babel/preset-env',
                            {
                                corejs: '2',
                                useBuiltIns: 'entry',
                                targets: {
                                    browsers: [
                                        // Best practice: https://github.com/babel/babel/issues/7789
                                        '>=1%',
                                        'not ie 11',
                                        'not op_mini all',
                                    ],
                                },
                            },
                        ]],
                        plugins:[
                            ["@babel/plugin-transform-runtime", {
                            "key": "ESLintWebpackPlugin",
                            "options": {
                                "cache": true,
                                "cacheLocation": "node_modules/.cache/eslint-webpack-plugin/.eslintcache",
                                "configType": "flat",
                                "extensions": "js",
                                "emitError": true,
                                "emitWarning": true,
                                "failOnError": true,
                                "resourceQueryExclude": [],
                                "extends": [
                                "eslint:recommended",
                                "google"
                                ],
                                "fix": true
                            }
                            }]
                            ]
                    },
                },
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            BUILD_VERSION: JSON.stringify(BUILD_VERSION),
            VERSION: JSON.stringify(PKG_VERSION),
        }),
    ],
};
