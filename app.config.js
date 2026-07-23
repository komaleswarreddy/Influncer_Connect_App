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
      // expo-notifications omitted from Expo Go entry — SDK 53 remote push errors on Android.
      // Re-add this plugin only for EAS/dev-client builds that need push.
      './plugins/withAndroidNetworkSecurity.js',
    ],
    extra: {
      ...extra,
      apiUrl: trim(process.env.EXPO_PUBLIC_API_URL) || extra.apiUrl || '',
      cognitoRegion: trim(process.env.EXPO_PUBLIC_COGNITO_REGION) || extra.cognitoRegion || '',
      cognitoUserPoolId:
        trim(process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID) || extra.cognitoUserPoolId || '',
      cognitoDomain: trim(process.env.EXPO_PUBLIC_COGNITO_DOMAIN) || extra.cognitoDomain || '',
      cognitoClientId: trim(process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID) || extra.cognitoClientId || '',
      cognitoRedirectUri:
        trim(process.env.EXPO_PUBLIC_COGNITO_REDIRECT_URI) || extra.cognitoRedirectUri || '',
      cognitoLogoutUri:
        trim(process.env.EXPO_PUBLIC_COGNITO_LOGOUT_URI) || extra.cognitoLogoutUri || '',
      useMockAuth: parseBool(process.env.EXPO_PUBLIC_USE_MOCK_AUTH, Boolean(extra.useMockAuth)),
      useMockApi: parseBool(process.env.EXPO_PUBLIC_USE_MOCK_API, Boolean(extra.useMockApi)),
      sentryDsn: trim(process.env.EXPO_PUBLIC_SENTRY_DSN) || extra.sentryDsn || '',
    },
  };
};
