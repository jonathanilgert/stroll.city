#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const disabledDir = path.join(process.cwd(), '.stroll', 'build-static-api-disabled');
let moved = false;

try {
  if (fs.existsSync(disabledDir)) fs.rmSync(disabledDir, { recursive: true, force: true });
  if (fs.existsSync(apiDir)) {
    fs.mkdirSync(path.dirname(disabledDir), { recursive: true });
    fs.renameSync(apiDir, disabledDir);
    moved = true;
  }
  const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['next', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, STROLL_STATIC_EXPORT: '1' },
  });
  process.exitCode = result.status ?? 1;
} finally {
  if (moved) fs.renameSync(disabledDir, apiDir);
}
