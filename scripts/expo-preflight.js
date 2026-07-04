/**
 * Reduces Windows EPERM on atomic renames into `.expo/*.json` (devices.json, packager-info, state).
 * - Deletes leftover `*.json.<random>` temp files from crashed runs.
 * - Removes `devices.json` so the next Expo run can create it cleanly (device list repopulates).
 * Run before `expo start` via npm scripts.
 */
const fs = require('fs');
const path = require('path');

const expoDir = path.join(__dirname, '..', '.expo');
const metroCacheDir = path.join(__dirname, '..', 'node_modules', '.cache', 'metro');

function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function isStaleJsonTemp(name) {
  if (name === 'devices.json' || name === 'packager-info.json' || name === 'state.json') return false;
  return (
    name.startsWith('devices.json.') ||
    name.startsWith('packager-info.json.') ||
    name.startsWith('state.json.')
  );
}

function main() {
  try {
    if (!fs.existsSync(expoDir)) {
      fs.mkdirSync(expoDir, { recursive: true });
      return;
    }
    const names = fs.readdirSync(expoDir);
    for (const name of names) {
      if (isStaleJsonTemp(name)) {
        const p = path.join(expoDir, name);
        if (safeUnlink(p)) {
          console.log('[expo-preflight] removed stale', name);
        }
      }
    }
    const devicesPath = path.join(expoDir, 'devices.json');
    if (safeUnlink(devicesPath)) {
      console.log('[expo-preflight] removed devices.json (Expo will recreate)');
    }
    // Metro cache can get corrupted on Windows and cause startup deserialize failures.
    if (fs.existsSync(metroCacheDir)) {
      fs.rmSync(metroCacheDir, { recursive: true, force: true });
      console.log('[expo-preflight] cleared Metro cache directory');
    }
  } catch (e) {
    console.warn('[expo-preflight]', e instanceof Error ? e.message : e);
  }
}

main();
