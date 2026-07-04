#!/usr/bin/env node
/**
 * Force USB/localhost + adb reverse (even if detection would pick LAN).
 * Prefer `npm run start:dev-client:usb` which sets EXPO_DEVCLIENT_USB=1.
 */
process.env.EXPO_DEVCLIENT_USB = '1';
require('./start-dev-client.js');
