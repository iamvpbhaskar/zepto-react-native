// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages from (local first, then root)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. CRITICAL: Intercept react/react-native resolutions and force them
//    to resolve from the mobile app's directory (finding React 19 locally)
//    instead of from the root workspace (which has React 18).
//    We do this by changing originModulePath to a file inside apps/mobile/
//    so Metro walks up from HERE and finds the local node_modules/react first.
const fakeOrigin = path.resolve(projectRoot, 'index.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react' ||
    moduleName.startsWith('react/') ||
    moduleName === 'react-native' ||
    moduleName.startsWith('react-native/')
  ) {
    return context.resolveRequest(
      { ...context, resolveRequest: undefined, originModulePath: fakeOrigin },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(
    { ...context, resolveRequest: undefined },
    moduleName,
    platform,
  );
};

module.exports = config;
