const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Enhanced resolver configuration for web compatibility
config.resolver.platforms = ['web', 'native', 'ios', 'android'];
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Map problematic React Native internals to react-native-web equivalents
config.resolver.alias = {
  '../Utilities/Platform': path.resolve(__dirname, 'node_modules/react-native-web/dist/vendor/react-native/Utilities/Platform.js'),
  'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface': 'react-native-web',
  'react-native/Libraries/ReactNative': 'react-native-web',
};

// Ignore specific problematic modules for web
config.resolver.blockList = [
  /node_modules\/react-native\/Libraries\/ReactPrivate\/ReactNativePrivateInterface\.js$/,
];

module.exports = config;