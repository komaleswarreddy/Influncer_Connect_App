import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import {
  cognitoClientId,
  cognitoConfigured,
  cognitoDomain,
  cognitoLogoutUri,
  cognitoRedirectUri,
  isExpoGo,
} from './auth-config';

WebBrowser.maybeCompleteAuthSession();

const SCOPES = ['openid', 'email', 'profile'];

/**
 * Android Custom Tab options — same proven pattern as Instagram OAuth
 * (`store/instagram-automation-store.ts`).
 *
 * Do NOT call WebBrowser.dismissAuthSession() on Android — it throws
 * UnavailabilityError and kills the release APK ("keeps stopping").
 * Confirmed via device logcat 2026-07-24.
 */
function androidAuthSessionOptions(): WebBrowser.AuthSessionOpenOptions {
  if (Platform.OS !== 'android') return {};
  return { createTask: false, showInRecents: false };
}

function dismissAuthSessionSafely(): void {
  // iOS-only API. Android throws UnavailabilityError (fatal in release).
  if (Platform.OS !== 'ios') return;
  try {
    void WebBrowser.dismissAuthSession();
  } catch {
    /* ignore */
  }
}

/**
 * Cognito callback URIs must match the app client allowlist exactly.
 *
 * Allowlisted for affiliate-mobile-client:
 *   affiliateplatform://auth/callback
 *   exp://…:8081 / exp://…:8081/--/
 */
export function getCognitoRedirectUri(): string {
  if (!isExpoGo) {
    return cognitoRedirectUri || 'affiliateplatform://auth/callback';
  }

  if (
    cognitoRedirectUri.startsWith('exp://') &&
    !/\/auth\/callback\/?$/i.test(cognitoRedirectUri)
  ) {
    return cognitoRedirectUri;
  }

  const fromAuthSession = AuthSession.makeRedirectUri({
    scheme: 'affiliateplatform',
  });
  const normalized = fromAuthSession
    .replace(/\/--\/auth\/callback\/?$/i, '/--/')
    .replace(/\/auth\/callback\/?$/i, '');

  if (normalized.startsWith('exp://') || normalized.startsWith('affiliateplatform://')) {
    return normalized.endsWith('/--') ? `${normalized}/` : normalized;
  }

  const hostUri = (Constants.expoConfig?.hostUri || '').replace(/\/+$/, '');
  if (hostUri) {
    return `exp://${hostUri}/--/`;
  }

  return cognitoRedirectUri || 'affiliateplatform://auth/callback';
}

function discovery(): AuthSession.DiscoveryDocument {
  const base = cognitoDomain.replace(/\/+$/, '');
  return {
    authorizationEndpoint: `${base}/oauth2/authorize`,
    tokenEndpoint: `${base}/oauth2/token`,
    revocationEndpoint: `${base}/oauth2/revoke`,
    endSessionEndpoint: `${base}/logout`,
  };
}

export type CognitoAuthResult = {
  idToken: string;
  accessToken?: string;
};

function parseCallbackParams(url: string): Record<string, string> {
  const q = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
  if (!q) return {};
  const out: Record<string, string> = {};
  for (const part of q.split('&')) {
    const [k, v] = part.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return out;
}

function isAuthCallbackUrl(url: string, redirectUri: string): boolean {
  if (!url) return false;
  const base = redirectUri.split('?')[0].replace(/\/+$/, '');
  if (url.startsWith(base)) return true;
  if (/affiliateplatform:\/\/auth\/callback/i.test(url)) return true;
  if (url.startsWith('exp://') && (url.includes('code=') || url.includes('error='))) return true;
  return false;
}

/**
 * Open Cognito Hosted UI and wait for the redirect.
 * Primary path matches Instagram (openAuthSessionAsync + createTask:false).
 * Linking is only a short fallback when Android returns dismiss while delivering the deep link —
 * never calls dismissAuthSession on Android.
 */
async function openCognitoAuthSession(
  authUrl: string,
  redirectUri: string
): Promise<WebBrowser.WebBrowserAuthSessionResult> {
  const options = androidAuthSessionOptions();

  // Prefer the simple Instagram-style path first (most reliable).
  const primary = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri, options);
  if (primary.type === 'success' && 'url' in primary && primary.url) {
    dismissAuthSessionSafely();
    return primary;
  }

  // Android sometimes reports dismiss while the deep link is already delivered via Linking.
  if (Platform.OS === 'android' && (primary.type === 'dismiss' || primary.type === 'cancel')) {
    const fromLink = await waitForAuthCallbackUrl(redirectUri, 2500);
    if (fromLink) {
      return { type: 'success', url: fromLink };
    }
  }

  return primary;
}

function waitForAuthCallbackUrl(redirectUri: string, timeoutMs: number): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (url: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.remove();
      resolve(url);
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (isAuthCallbackUrl(url, redirectUri)) done(url);
    });

    const timer = setTimeout(() => done(null), timeoutMs);

    void Linking.getInitialURL()
      .then((url) => {
        if (url && isAuthCallbackUrl(url, redirectUri)) done(url);
      })
      .catch(() => undefined);
  });
}

/**
 * Open Cognito Hosted UI (email/password), exchange code for tokens (PKCE).
 */
export async function signInWithCognito(): Promise<CognitoAuthResult> {
  if (!cognitoConfigured) {
    throw new Error('Cognito is not configured. Set EXPO_PUBLIC_COGNITO_* in mobile/.env.');
  }

  const redirectUri = getCognitoRedirectUri();
  if (__DEV__) {
    console.log('[Cognito] redirectUri=', redirectUri);
    console.log('[Cognito] clientId=', cognitoClientId);
    console.log('[Cognito] domain=', cognitoDomain);
  }

  const request = new AuthSession.AuthRequest({
    clientId: cognitoClientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    scopes: SCOPES,
    usePKCE: true,
    // Do NOT set prompt=login — it forces a full Cognito form every tap (slow in Expo Go /
    // Custom Tabs). Web OAuth also omits prompt so SSO cookies can reuse a session.
    // If a leftover session shows a blank Hosted UI, user can Sign out then retry.
  });

  const tAuth = Date.now();
  const authUrl = await request.makeAuthUrlAsync(discovery());
  if (__DEV__) {
    console.log('[Cognito] authUrl=', authUrl);
    console.log(`[Cognito] makeAuthUrl ${Date.now() - tAuth}ms`);
  }

  const tUi = Date.now();
  const result = await openCognitoAuthSession(authUrl, redirectUri);
  if (__DEV__) console.log(`[Cognito] hostedUI session ${Date.now() - tUi}ms type=${result.type}`);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error(
      'Sign-in was cancelled or the browser did not return to the app. Close all Cognito tabs and try again.'
    );
  }
  if (result.type !== 'success' || !('url' in result) || !result.url) {
    throw new Error('Cognito sign-in failed');
  }

  const params = parseCallbackParams(result.url);
  if (params.error) {
    throw new Error(
      params.error_description || `Cognito error: ${params.error}. redirectUri=${redirectUri}`
    );
  }
  const code = params.code;
  if (!code) {
    throw new Error(`No authorization code returned. redirectUri=${redirectUri}`);
  }

  const tTok = Date.now();
  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId: cognitoClientId,
      code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier || '',
      },
    },
    discovery()
  );
  if (__DEV__) console.log(`[Cognito] code→token ${Date.now() - tTok}ms`);

  const idToken = tokenResponse.idToken;
  if (!idToken) {
    throw new Error('No ID token returned from Cognito. Check client configuration.');
  }

  return {
    idToken,
    accessToken: tokenResponse.accessToken,
  };
}

/** @deprecated Use signInWithCognito */
export const signInWithCognitoGoogle = signInWithCognito;

/** Cognito Hosted UI logout (best-effort). */
export async function logoutFromCognito(): Promise<void> {
  if (!cognitoConfigured) return;
  const logoutUri = encodeURIComponent(cognitoLogoutUri);
  const url = `${cognitoDomain}/logout?client_id=${encodeURIComponent(cognitoClientId)}&logout_uri=${logoutUri}`;
  try {
    await WebBrowser.openAuthSessionAsync(url, cognitoLogoutUri, androidAuthSessionOptions());
  } catch {
    /* still clear local session */
  }
}
