#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const isDev = args.includes('--dev');
const portArg = args.find(arg => arg.startsWith('--port='));
const port = portArg ? portArg.split('=')[1] : '3000';

const packageDir = path.resolve(__dirname, '..');
const nextBin = path.join(packageDir, 'node_modules', '.bin', 'next');

const command = isDev ? 'dev' : 'start';
const spawnArgs = [command, '-p', port];

const child = spawn(nextBin, spawnArgs, {
  cwd: packageDir,
  stdio: 'inherit'
});

const shutdown = () => {
  child.kill('SIGTERM');
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
