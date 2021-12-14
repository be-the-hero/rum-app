const os = require('os');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const config = require('./webpack.config.base');

config.devtool(process.env.DEBUG_PROD === 'true' ? 'source-map' : false);
config.mode('production');

config.performance.maxEntrypointSize((1024 ** 2) * 50);
config.performance.maxAssetSize((1024 ** 2) * 50);

if (!process.env.WEBPACK_BROWSER) {
  config.output.publicPath('./');
} else {
  config.output.publicPath('/');
}
config.output.path(path.join(__dirname, '../../src/dist'));
config.output.filename('renderer.prod.js');

config.optimization.minimizer('terser')
  .use(TerserPlugin, [{
    extractComments: false,
    parallel: Math.min(4, os.cpus().length - 1),
    terserOptions: {
      format: {
        comments: false,
      },
    },
  }]);

module.exports = config.toConfig();
