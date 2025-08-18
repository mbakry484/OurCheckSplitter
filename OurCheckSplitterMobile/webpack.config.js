const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add alias to resolve Platform utilities
  config.resolve.alias = {
    ...config.resolve.alias,
    '../Utilities/Platform': path.resolve(__dirname, 'node_modules/react-native-web/dist/vendor/react-native/Utilities/Platform.js'),
  };
  
  return config;
};