const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');

const mainPath = join(__dirname, 'dist', 'main', 'main', 'index.js');
const preloadPath = join(__dirname, 'dist', 'main', 'main', 'preload.js');

if (!existsSync(mainPath) || !existsSync(preloadPath)) {
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(cmd, ['run', 'build:main'], { stdio: 'inherit', cwd: __dirname, shell: false });
  if (result.status !== 0) {
    console.error('Failed to build Electron main process. Run: npm run build:main');
    process.exit(result.status ?? 1);
  }
}

require(mainPath);
