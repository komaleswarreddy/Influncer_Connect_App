#!/usr/bin/env node
/**
 * Keeps adb reverse mappings alive while Metro runs.
 * Useful when some Android USB connections intermittently flip offline/online.
 *
 * Usage:
 *   node scripts/adb-reverse-watch.js [8081] [3003 ...]
 */
const { spawnSync } = require('child_process');
const { getAdbPath } = require('./adb-path');

const ports =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2).map((p) => parseInt(p, 10)).filter((n) => Number.isFinite(n) && n > 0)
    : [8081, 3003];

const adb = getAdbPath();
let lastState = '';

function runAdb(args) {
  return spawnSync(adb, args, { encoding: 'utf8', shell: false });
}

function getState() {
  const r = runAdb(['get-state']);
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim().toLowerCase();
  if (out.includes('offline')) return 'offline';
  if (out.includes('unauthorized')) return 'unauthorized';
  if (out === 'device' || out.includes('\ndevice')) return 'device';
  if (out.includes('not found') || out.includes('no devices')) return 'none';
  return out || 'unknown';
}

function hasReverse(port) {
  const r = runAdb(['reverse', '--list']);
  if (r.status !== 0) return false;
  const needle = `tcp:${port}`;
  const lines = String(r.stdout || '').split('\n').map((x) => x.trim());
  return lines.some((line) => line.includes(needle));
}

function ensureReverse(port) {
  if (hasReverse(port)) return true;
  const r = runAdb(['reverse', `tcp:${port}`, `tcp:${port}`]);
  return r.status === 0;
}

function tick() {
  const state = getState();
  if (state !== lastState) {
    console.log(`[adb-watch] device state: ${state}`);
    lastState = state;
  }
  if (state !== 'device') return;
  for (const port of ports) {
    const ok = ensureReverse(port);
    if (!ok) {
      console.log(`[adb-watch] failed mapping tcp:${port}, will retry`);
    }
  }
}

runAdb(['start-server']);
tick();
const id = setInterval(tick, 3000);

function stop() {
  clearInterval(id);
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
