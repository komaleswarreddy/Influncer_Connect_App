#!/usr/bin/env node
/**
 * Usage: node scripts/adb-reverse.js [8081] [3000 ...]
 * Forwards each hostPort to the same port on the device (adb reverse).
 * Default: 8081 (Metro) and 3000 (local API).
 *
 * Hardening:
 * - waits for a healthy "device" state (not "offline")
 * - retries reverse setup
 * - prints clear fix hints before failing
 */
const { spawnSync } = require('child_process');
const { getAdbPath } = require('./adb-path');

const ports =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2).map((p) => parseInt(p, 10))
    : [8081, 3000];

const adb = getAdbPath();

function runAdb(args) {
  return spawnSync(adb, args, { encoding: 'utf8', shell: false });
}

function sleepMs(ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    // Busy-wait is acceptable here; this script is short-lived.
  }
}

function getDeviceState() {
  const r = runAdb(['get-state']);
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim().toLowerCase();
  if (out.includes('offline')) return 'offline';
  if (out.includes('unauthorized')) return 'unauthorized';
  if (out === 'device' || out.includes('\ndevice')) return 'device';
  if (out.includes('not found') || out.includes('no devices')) return 'none';
  return out || 'unknown';
}

function waitForHealthyDevice(timeoutMs) {
  const start = Date.now();
  let last = '';
  let restartAttempted = false;

  runAdb(['start-server']);

  while (Date.now() - start < timeoutMs) {
    const state = getDeviceState();
    if (state === 'device') return true;

    if (state !== last) {
      console.log(`[adb-reverse] waiting for USB device, current state: ${state}`);
      last = state;
    }

    // Offline often clears after adb restart.
    if (!restartAttempted && (state === 'offline' || state === 'unknown')) {
      runAdb(['kill-server']);
      runAdb(['start-server']);
      restartAttempted = true;
    }

    sleepMs(1200);
  }
  return false;
}

function applyReverseWithRetry(port) {
  for (let i = 1; i <= 3; i++) {
    const r = runAdb(['reverse', `tcp:${port}`, `tcp:${port}`]);
    if (r.status === 0) return true;
    const msg = `${(r.stderr || '').trim()} ${(r.stdout || '').trim()}`.trim();
    console.log(`[adb-reverse] retry ${i}/3 failed for ${port}: ${msg || 'unknown error'}`);
    sleepMs(700);
  }
  return false;
}

if (!waitForHealthyDevice(45000)) {
  console.error('[adb-reverse] Could not detect a healthy USB device within 45s.');
  console.error('[adb-reverse] Fix checklist:');
  console.error('  1) Reconnect USB cable and keep phone unlocked');
  console.error('  2) Disable/enable USB debugging');
  console.error('  3) Accept RSA fingerprint prompt on device');
  console.error('  4) Run: adb kill-server && adb start-server && adb devices');
  process.exit(1);
}

// Fresh mapping avoids stale/duplicate reverse entries after reconnects.
runAdb(['reverse', '--remove-all']);

for (const port of ports) {
  if (!Number.isFinite(port) || port <= 0) continue;
  const ok = applyReverseWithRetry(port);
  if (!ok) {
    console.error(`[adb-reverse] failed to map tcp:${port}.`);
    process.exit(1);
  }
  console.log(`[adb-reverse] tcp:${port} -> tcp:${port}`);
}

const list = runAdb(['reverse', '--list']);
if (list.status === 0) {
  const lines = String(list.stdout || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
  if (lines.length) {
    console.log('[adb-reverse] active mappings:');
    for (const line of lines) console.log(`  ${line}`);
  }
}
