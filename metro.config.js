const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Permite o carregamento de arquivos .wasm necessários para o SQLite na web
config.resolver.assetExts.push('wasm');

module.exports = config;