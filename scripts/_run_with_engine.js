const fs = require('fs');
const path = require('path');

if (process.argv.length < 4) {
  console.error('usage: node scripts/_run_with_engine.js <enginePath> <scriptPath> [script args...]');
  process.exit(2);
}

const enginePath = path.resolve(process.argv[2]);
const scriptPath = path.resolve(process.argv[3]);
const passthroughArgs = process.argv.slice(4);

const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function patchedReadFileSync(filePath, options) {
  if (typeof filePath === 'string') {
    const normalized = filePath.replace(/\\/g, '/');
    if (normalized === 'js/all.js') {
      return originalReadFileSync.call(fs, enginePath, options);
    }
  }
  return originalReadFileSync.call(fs, filePath, options);
};

process.argv = [process.argv[0], scriptPath, ...passthroughArgs];
require(scriptPath);
