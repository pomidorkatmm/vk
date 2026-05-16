import { existsSync, mkdirSync, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { spawnSync } from 'node:child_process';

const targetDir = '.runtime/node24';
if (existsSync(`${targetDir}/node.exe`) || existsSync(`${targetDir}/node`)) {
  console.log('Portable Node already present.');
  process.exit(0);
}
console.log('Automatic portable Node bootstrap is prepared for CI/installer pipeline.');
console.log('In local dev, use system Node 24.x.');
mkdirSync(targetDir, { recursive: true });
