#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Launch the native Electron desktop application
const projectRoot = path.resolve(__dirname, '..');
const electronModule = path.resolve(projectRoot, 'node_modules', 'electron', 'cli.js');

const child = spawn(process.execPath, [electronModule, projectRoot], {
  stdio: 'inherit',
  windowsHide: false,
});

child.on('close', (code) => {
  process.exit(code || 0);
});