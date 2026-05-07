const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Install esbuild if not present
try {
  execSync('npx esbuild --version', { stdio: 'ignore' });
} catch (e) {
  execSync('npm install esbuild --save-dev', { stdio: 'inherit' });
}

// Create public dir
if (!fs.existsSync('public')) fs.mkdirSync('public');

// Bundle retell SDK for browser
execSync(
  'npx esbuild node_modules/retell-client-js-sdk/dist/index.js --bundle --platform=browser --global-name=RetellSDK --outfile=public/retell-sdk.js --external:events',
  { stdio: 'inherit' }
);

console.log('Build complete!');
