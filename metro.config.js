// metro.config.js

const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add .cjs support
defaultConfig.resolver.sourceExts.push('cjs');

// ✅ This line avoids issues with "auth not registered" and export maps
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;