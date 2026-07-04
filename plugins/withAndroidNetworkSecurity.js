/**
 * Ensures cleartext HTTP to Metro / LAN APIs is allowed on release-like Android builds.
 * Complements `android.usesCleartextTraffic` by emitting `res/xml/network_security_config.xml`
 * and wiring `android:networkSecurityConfig` on the application node (EAS prebuild).
 */
const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

const NETWORK_SECURITY_XML = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
      <certificates src="user" />
    </trust-anchors>
  </base-config>
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">localhost</domain>
    <domain includeSubdomains="true">127.0.0.1</domain>
    <domain includeSubdomains="true">10.0.2.2</domain>
  </domain-config>
  <debug-overrides cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
      <certificates src="user" />
    </trust-anchors>
  </debug-overrides>
</network-security-config>
`;

/** @param {import('@expo/config').ExpoConfig} config */
function withAndroidNetworkSecurity(config) {
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const root = cfg.modRequest.platformProjectRoot;
      const xmlDir = path.join(root, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'network_security_config.xml'), NETWORK_SECURITY_XML, 'utf8');
      return cfg;
    },
  ]);

  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    // Other native deps may set networkSecurityConfig; tools:replace keeps our cleartext dev config.
    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const apps = manifest.application;
    if (!Array.isArray(apps) || !apps[0]) {
      return cfg;
    }
    const app = apps[0];
    app.$ = app.$ || {};
    app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    app.$['android:usesCleartextTraffic'] = 'true';
    app.$['tools:replace'] = 'android:networkSecurityConfig';
    return cfg;
  });
}

module.exports = withAndroidNetworkSecurity;
