#!/usr/bin/env node
/**
 * Starts Expo for expo-dev-client with the right Metro reachability:
 * - USB / emulator (adb sees a device): adb reverse + Metro --localhost (device 127.0.0.1 → PC).
 * - No adb device: plain dev-client start (LAN URL for Wi‑Fi).
 *
 * Env:
 * - EXPO_DEVCLIENT_USB=1 — force USB/localhost mode (same as start-expo-usb).
 * - EXPO_DEVCLIENT_LAN_ONLY=1 — never use --localhost even if adb has a device.
 *
 * Extra CLI args are forwarded to `expo start` (e.g. --clear).
 */
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const os = require('os');
const { getAdbPath } = require('./adb-path');

const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const androidSdk = path.join(localAppData, 'Android', 'Sdk');
const platformTools = path.join(androidSdk, 'platform-tools');

process.env.ANDROID_HOME = process.env.ANDROID_HOME || androidSdk;
process.env.ANDROID_SDK_ROOT = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
process.env.EXPO_NO_METRO_WORKSPACE_ROOT = '1';
/** Avoid undici "Body has already been read" during Expo CLI dependency / native-module version fetches (Windows/Node 22). */
if (!process.env.EXPO_NO_DOCTOR) process.env.EXPO_NO_DOCTOR = '1';
if (!process.env.EXPO_NO_DEPENDENCY_VALIDATION) process.env.EXPO_NO_DEPENDENCY_VALIDATION = '1';

const sep = path.delimiter;
if (process.platform === 'win32' && !process.env.PATH.split(sep).includes(platformTools)) {
  process.env.PATH = `${platformTools}${sep}${process.env.PATH || ''}`;
}

const mobileRoot = path.join(__dirname, '..');
require(path.join(__dirname, 'expo-preflight.js'));

const extraArgs = process.argv.slice(2);

function adbHasReadyDevice() {
  const adb = getAdbPath();
  spawnSync(adb, ['start-server'], { encoding: 'utf8', shell: false });
  const r = spawnSync(adb, ['devices'], { encoding: 'utf8', shell: false });
  if (r.status !== 0) return false;
  const lines = String(r.stdout || '').split('\n');
  for (const line of lines) {
    if (/\tdevice\s*$/.test(line)) return true;
  }
  return false;
}

const forceUsb = process.env.EXPO_DEVCLIENT_USB === '1';
const lanOnly = process.env.EXPO_DEVCLIENT_LAN_ONLY === '1';
const useLocalhost = (forceUsb || (!lanOnly && adbHasReadyDevice()));

if (useLocalhost) {
  console.log(
    '[expo] ADB device detected — using Metro --localhost + port reverse (8081, 3000). ' +
      'If you see connection errors, run: npm run adb:reverse'
  );
  const pre = spawnSync(process.execPath, [path.join(__dirname, 'adb-reverse.js'), '8081', '3000'], {
    cwd: mobileRoot,
    stdio: 'inherit',
    shell: false,
  });
  if (pre.status !== 0) {
    process.exit(pre.status ?? 1);
  }
} else {
  console.log(
    '[expo] No ADB device — Metro will use LAN. Use the URL shown in the terminal, or connect USB and restart.'
  );
}

const watchCmd =
  process.platform === 'win32'
    ? 'node .\\scripts\\adb-reverse-watch.js 8081 3000'
    : 'node ./scripts/adb-reverse-watch.js 8081 3000';

const expoParts = ['expo', 'start', '--dev-client', ...(useLocalhost ? ['--localhost'] : []), ...extraArgs];
const expoCmd =
  process.platform === 'win32'
    ? `npx.cmd ${expoParts.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(' ')}`
    : `npx ${expoParts.join(' ')}`;

let watcher = null;
if (useLocalhost) {
  watcher = spawn(watchCmd, {
    stdio: 'inherit',
    env: process.env,
    shell: true,
    cwd: mobileRoot,
  });
}

const expo = spawn(expoCmd, {
  stdio: 'inherit',
  env: process.env,
  shell: true,
  cwd: mobileRoot,
});

const cleanup = () => {
  if (watcher && !watcher.killed) watcher.kill('SIGTERM');
  if (!expo.killed) expo.kill('SIGTERM');
};
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

expo.on('exit', (code, signal) => {
  if (watcher && !watcher.killed) watcher.kill('SIGTERM');
  process.exit(code ?? (signal ? 1 : 0));
});
