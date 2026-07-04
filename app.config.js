/**
 * Dynamic Expo config — loads EXPO_PUBLIC_* from `mobile/.env` (Expo CLI loads it automatically).
 * Merges into `extra` so Constants.expoConfig.extra stays in sync with env at build time.
 *
 * @param {{ config: import('@expo/config').ExpoConfig }} ctx
 */
module.exports = ({ config }) => {
  const extra = config.extra || {};

  const parseBool = (v, fallback) => {
    if (v === 'true') return true;
    if (v === 'false') return false;
    return fallback;
  };

  const trim = (s) => (typeof s === 'string' ? s.trim() : '');

  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      'expo-secure-store',
      'expo-video',
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#1e3a5f',
          defaultChannel: 'default',
        },
      ],
      './plugins/withAndroidNetworkSecurity.js',
    ],
    extra: {
      ...extra,
      apiUrl: trim(process.env.EXPO_PUBLIC_API_URL) || extra.apiUrl || '',
      kindeDomain: trim(process.env.EXPO_PUBLIC_KINDE_DOMAIN) || extra.kindeDomain || '',
      kindeClientId: trim(process.env.EXPO_PUBLIC_KINDE_CLIENT_ID) || extra.kindeClientId || '',
      kindeConnectionId:
        trim(process.env.EXPO_PUBLIC_KINDE_CONNECTION_ID) || extra.kindeConnectionId || '',
      useMockAuth: parseBool(process.env.EXPO_PUBLIC_USE_MOCK_AUTH, Boolean(extra.useMockAuth)),
      useMockApi: parseBool(process.env.EXPO_PUBLIC_USE_MOCK_API, Boolean(extra.useMockApi)),
    },
  };
};
