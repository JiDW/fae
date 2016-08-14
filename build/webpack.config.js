'use strict';

const path      = require('path');
const fs        = require('fs');
const webpack   = require('webpack');
const pkg       = require('../package.json');

const EntryGeneratorPlugin = require('./EntryGeneratorPlugin');

const pluginbase = path.join(__dirname, '..', 'plugins');
const pluginList = process.env.FAE_PLUGINS ? process.env.FAE_PLUGINS.split(',') : fs.readdirSync(pluginbase);

const config = { pkg };

// set debug if not in prod build mode
if (process.env.NODE_ENV !== 'production')
{
    config.DEBUG = true;
}

// core is always required
if (pluginList.indexOf('core') === -1)
{
    pluginList.push('core');
}

// configure aliases for plugins
const aliases = {};

for (let i = 0; i < pluginList.length; ++i)
{
    // TODO: install a plugin if it doesn't exist in plugins folder (3rd-party plugin)
    aliases[`@fae/${pluginList[i]}`] = path.join(pluginbase, pluginList[i]);
}

// main config
module.exports = {
    // entry: path.join(__dirname, '..', 'src', 'index.js'),
    output: {
        path: path.join(__dirname, '..', 'dist'),
        library: 'Fae',
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loaders: [
                    'babel?cacheDirectory=true&presets[]=es2015-loose',
                    `preprocess?${JSON.stringify(config)}`,
                ],
            },
            {
                test: /\.(glsl|frag|vert)$/,
                exclude: /(node_modules|vendor)/,
                loader: 'webpack-glsl',
            },
        ],
    },
    resolve: {
        alias: aliases,
    },
    plugins: [
        // generate entry file
        new EntryGeneratorPlugin(pluginList),

        // don't emit output when there are errors
        new webpack.NoErrorsPlugin(),

        // Add a banner to output chunks
        new webpack.BannerPlugin(loadBannerText(), { raw: true, entry: true }),
    ],
};

function loadBannerText()
{
    let str = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8');

    str = str.replace('{{version}}', pkg.version);
    str = str.replace('{{compileDate}}', (new Date()).toISOString());
    str = str.replace('{{commitHash}}', fs.readFileSync('./.commit', 'utf8').trim());
    str = str.replace('{{homepage}}', pkg.homepage);
    str = str.replace('{{license}}', pkg.license);

    return str;
}
