/**
 * Resolve adb executable so npm scripts work even when User PATH was updated
 * after the parent terminal (Cursor) was started.
 */
const fs = require('fs');
const path = require('path');

function getAdbPath() {
  const fromEnv = process.env.ADB_PATH && process.env.ADB_PATH.trim();
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA || '';
    const candidate = path.join(local, 'Android', 'platform-tools', 'adb.exe');
    if (fs.existsSync(candidate)) return candidate;
  }

  const home = process.env.HOME || process.env.USERPROFILE || '';
  const macLinux = path.join(home, 'Library', 'Android', 'sdk', 'platform-tools', 'adb');
  if (process.platform === 'darwin' && fs.existsSync(macLinux)) return macLinux;

  const linuxHome = path.join(home, 'Android', 'Sdk', 'platform-tools', 'adb');
  if (process.platform === 'linux' && fs.existsSync(linuxHome)) return linuxHome;

  return 'adb';
}

module.exports = { getAdbPath };
