import Constants from 'expo-constants';

type Extra = {
  apiUrl?: string;
  cognitoRegion?: string;
  cognitoUserPoolId?: string;
  cognitoDomain?: string;
  cognitoClientId?: string;
  cognitoRedirectUri?: string;
  cognitoLogoutUri?: string;
  useMockAuth?: boolean;
  useMockApi?: boolean;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
const executionEnvironment = (Constants as { executionEnvironment?: string }).executionEnvironment;

const trim = (s: string | undefined) => (typeof s === 'string' ? s.trim() : '');

/** Env wins (EAS / Metro inlines EXPO_PUBLIC_*); `extra` from app.config.js is fallback. */
export const cognitoRegion =
  trim(process.env.EXPO_PUBLIC_COGNITO_REGION) ||
  (typeof extra.cognitoRegion === 'string' ? extra.cognitoRegion.trim() : '');

export const cognitoUserPoolId =
  trim(process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID) ||
  (typeof extra.cognitoUserPoolId === 'string' ? extra.cognitoUserPoolId.trim() : '');

export const cognitoDomain = (
  trim(process.env.EXPO_PUBLIC_COGNITO_DOMAIN) ||
  (typeof extra.cognitoDomain === 'string' ? extra.cognitoDomain.trim() : '')
).replace(/\/+$/, '');

export const cognitoClientId =
  trim(process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID) ||
  (typeof extra.cognitoClientId === 'string' ? extra.cognitoClientId.trim() : '');

export const cognitoRedirectUri =
  trim(process.env.EXPO_PUBLIC_COGNITO_REDIRECT_URI) ||
  (typeof extra.cognitoRedirectUri === 'string' ? extra.cognitoRedirectUri.trim() : '') ||
  'affiliateplatform://auth/callback';

export const cognitoLogoutUri =
  trim(process.env.EXPO_PUBLIC_COGNITO_LOGOUT_URI) ||
  (typeof extra.cognitoLogoutUri === 'string' ? extra.cognitoLogoutUri.trim() : '') ||
  'affiliate-platform://';

export const cognitoConfigured =
  cognitoDomain.startsWith('https://') && cognitoClientId.length > 0 && cognitoRegion.length > 0;

function envBool(name: string): boolean | undefined {
  const v = trim(process.env[name]);
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

/** Mock email/password only when explicitly enabled AND running a dev bundle.
 * The `__DEV__` gate is a hard backstop: a stale `true` in app.json's `extra.useMockAuth`,
 * or a misconfigured EAS build environment, can never make a shipped release build
 * fabricate a fake login/registration — `__DEV__` is `false` in every release binary. */
export const useMockAuth =
  __DEV__ && (envBool('EXPO_PUBLIC_USE_MOCK_AUTH') ?? extra.useMockAuth === true);

/** JsonPlaceholder-style mocks for API — same hard `__DEV__` backstop as useMockAuth. */
export const useMockApi =
  __DEV__ && (envBool('EXPO_PUBLIC_USE_MOCK_API') ?? extra.useMockApi === true);

/** Expo Go runtime (store client). Native custom modules are unavailable here. */
export const isExpoGo = executionEnvironment === 'storeClient';
