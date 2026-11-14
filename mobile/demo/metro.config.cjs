const path = require('node:path');
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, '..')];
const replacements = new Map([
  [path.resolve(__dirname, '../src/api/client'), path.join(__dirname, 'fixtures.ts')],
  [path.resolve(__dirname, '../src/api/reservations'), path.join(__dirname, 'fixtures.ts')],
]);
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-barcode-scanner') {
    return { type: 'sourceFile', filePath: path.join(__dirname, 'DemoCamera.tsx') };
  }
  const resolved = path.resolve(path.dirname(context.originModulePath), moduleName).replace(/\.tsx?$/, '');
  if (replacements.has(resolved)) return { type: 'sourceFile', filePath: replacements.get(resolved) };
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
