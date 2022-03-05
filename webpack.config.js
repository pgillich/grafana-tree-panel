const pluginJson = require('./src/plugin.json');
module.exports.getWebpackConfig = (config, options) => ({
  ...config,
  output: {
    ...config.output,
    publicPath: `public/plugins/${pluginJson.id}/`,
  },
  node: {
    child_process: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    dns: 'empty',
    'human-signals': 'empty',
  }
});
