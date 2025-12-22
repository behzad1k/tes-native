// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for web platform builds
// if (process.env.EXPO_PLATFORM === 'web') {
    // Web-specific resolver configuration
    config.resolver.alias = {
        'react-native': 'react-native-web',
        '@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.js': require.resolve('./src/utils/asyncStorageWeb.js'),
        '@maplibre/maplibre-react-native': require.resolve('./src/utils/maplibreWebMock.js'),
    };

    // Ensure proper platform resolution
    config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// }

module.exports = config;