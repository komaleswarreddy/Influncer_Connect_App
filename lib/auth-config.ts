import Constants from 'expo-constants';

type Extra = {
  apiUrl?: string;
  kindeDomain?: string;
  kindeClientId?: string;
  kindeConnectionId?: string;
  useMockAuth?: boolean;
  useMockApi?: boolean;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const trim = (s: string | undefined) => (typeof s === 'string' ? s.trim() : '');

/** Env wins (EAS / Metro inlines EXPO_PUBLIC_*); `extra` from app.config.js is fallback. */
export const kindeDomain =
  trim(process.env.EXPO_PUBLIC_KINDE_DOMAIN) ||
  (typeof extra.kindeDomain === 'string' ? extra.kindeDomain.trim() : '');
export const kindeClientId =
  trim(process.env.EXPO_PUBLIC_KINDE_CLIENT_ID) ||
  (typeof extra.kindeClientId === 'string' ? extra.kindeClientId.trim() : '');
export const kindeConnectionId =
  trim(process.env.EXPO_PUBLIC_KINDE_CONNECTION_ID) ||
  (typeof extra.kindeConnectionId === 'string' ? extra.kindeConnectionId.trim() : '');

export const kindePostLogoutRedirectUrl =
  trim(process.env.EXPO_PUBLIC_KINDE_POST_LOGOUT_REDIRECT_URL) || '';

export const kindeConfigured =
  kindeDomain.startsWith('https://') && kindeClientId.length > 0;

function envBool(name: string): boolean | undefined {
  const v = trim(process.env[name]);
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

/** Mock email/password only when explicitly enabled (dev). */
export const useMockAuth =
  envBool('EXPO_PUBLIC_USE_MOCK_AUTH') ?? extra.useMockAuth === true;

/** JsonPlaceholder-style mocks for API (dev only). */
export const useMockApi = envBool('EXPO_PUBLIC_USE_MOCK_API') ?? extra.useMockApi === true;
