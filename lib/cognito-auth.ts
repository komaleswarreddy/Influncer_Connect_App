import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
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
import { bestEffortCloseBrowser, withTimeout, WebBrowserTimeoutError } from './web-browser-session';

WebBrowser.maybeCompleteAuthSession();

const SCOPES = ['openid', 'email', 'profile'];

/** Thrown when the user genuinely dismissed/cancelled the Hosted UI browser sheet. */
export class CognitoCancelledError extends Error {
  readonly code = 'COGNITO_CANCELLED' as const;
  constructor(message: string) {
    super(message);
    this.name = 'CognitoCancelledError';
  }
}

const SIGN_IN_TIMEOUT_MS = 45_000;
// Logout runs in the background after the local session is already cleared, so a stuck tab
// should be nudged away quickly rather than left over the login screen.
const LOGOUT_TIMEOUT_MS = 4_000;

/**
 * PKCE code_verifier only ever lived in the in-memory AuthRequest instance.
 * If the app process is killed while the Hosted UI is open (backgrounded too
 * long, OS memory pressure), the JS heap — and that verifier — is gone, and
 * the app relaunches fresh into app/auth/callback.tsx via the deep link with
 * nobody left to finish the exchange. Persisting the verifier here (cleared
 * immediately after first use) lets that cold-start relaunch complete the
 * same code→token exchange itself instead of discarding a valid auth code.
 */
const PKCE_PENDING_KEY = 'cognito_pkce_pending';

type PendingPkce = { codeVerifier: string; redirectUri: string; state: string };

async function storePendingPkce(data: PendingPkce): Promise<void> {
  try {
    await SecureStore.setItemAsync(PKCE_PENDING_KEY, JSON.stringify(data));
  } catch {
    /* best-effort — cold-start recovery just won't be available for this attempt */
  }
}

async function takePendingPkce(): Promise<PendingPkce | null> {
  try {
    const raw = await SecureStore.getItemAsync(PKCE_PENDING_KEY);
    if (!raw) return null;
    await SecureStore.deleteItemAsync(PKCE_PENDING_KEY);
    return JSON.parse(raw) as PendingPkce;
  } catch {
    return null;
  }
}

async function clearPendingPkce(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PKCE_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

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
  // Production/dev-client scheme: require an exact scheme+host+path match, not a substring test.
  if (/^affiliateplatform:\/\/auth\/callback(?:[/?#]|$)/i.test(url)) return true;
  // Expo Go dev-only branch: still require the path to actually end in /auth/callback (before
  // any query/fragment), not merely contain "code=" or "error=" anywhere in the URL.
  if (url.startsWith('exp://')) {
    const pathPart = url.split(/[?#]/)[0];
    if (
      /\/auth\/callback\/?$/i.test(pathPart) &&
      (url.includes('code=') || url.includes('error='))
    ) {
      return true;
    }
  }
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

  // Prefer the simple Instagram-style path first (most reliable). Bounded so
  // a native/Hosted-UI quirk that never hands control back can't hang the
  // sign-in flow (and the "Continue with Google" button's busy state) forever.
  let primary: WebBrowser.WebBrowserAuthSessionResult;
  try {
    primary = await withTimeout(
      WebBrowser.openAuthSessionAsync(authUrl, redirectUri, options),
      SIGN_IN_TIMEOUT_MS,
      'Sign-in timed out.'
    );
  } catch (e) {
    if (e instanceof WebBrowserTimeoutError) {
      bestEffortCloseBrowser();
    }
    throw e;
  }
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

  // Persisted before opening the browser so a cold-start relaunch (app killed
  // while Hosted UI was open) can still complete this exact code exchange —
  // see tryCompletePendingCognitoAuth().
  await storePendingPkce({
    codeVerifier: request.codeVerifier || '',
    redirectUri,
    state: request.state || '',
  });

  try {
    const tUi = Date.now();
    const result = await openCognitoAuthSession(authUrl, redirectUri);
    if (__DEV__)
      console.log(`[Cognito] hostedUI session ${Date.now() - tUi}ms type=${result.type}`);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new CognitoCancelledError(
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
    // CSRF/callback-injection protection: the `state` returned by Cognito must match the one
    // this exact AuthRequest generated. Without this check, a malicious app registered for the
    // same custom scheme (or an injected deep link) could hand us its own authorization code and
    // we'd exchange it as if it were the user's.
    if (!request.state || params.state !== request.state) {
      throw new Error('Authentication failed: state mismatch');
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
  } finally {
    // This JS instance is handling (or has failed to handle) the exchange —
    // don't leave a stale verifier around for a cold-start relaunch to retry
    // against an already-used/expired authorization code.
    await clearPendingPkce();
  }
}

/**
 * Called once on mount by app/auth/callback.tsx. Handles the case where the
 * app process was killed while the Cognito Hosted UI was open: the OS
 * relaunches the app straight into this deep link with no in-memory
 * AuthRequest left to finish the exchange. Recovers the persisted PKCE
 * verifier (stored by signInWithCognito right before opening the browser)
 * and completes the same code→token exchange here instead.
 *
 * Returns null when there's nothing to complete (no incoming code, or no
 * pending verifier — e.g. the normal in-process flow already handled it).
 */
export async function tryCompletePendingCognitoAuth(): Promise<CognitoAuthResult | null> {
  if (!cognitoConfigured) return null;

  const initialUrl = await Linking.getInitialURL().catch(() => null);
  if (!initialUrl) return null;

  const params = parseCallbackParams(initialUrl);
  if (params.error) {
    throw new Error(params.error_description || `Cognito error: ${params.error}`);
  }
  const code = params.code;
  if (!code) return null;

  const pending = await takePendingPkce();
  if (!pending) return null;

  // Same CSRF/callback-injection protection as the in-process flow (see signInWithCognito) —
  // the cold-start recovery path must not exchange a code whose state doesn't match what was
  // persisted for this exact pending auth attempt.
  if (!pending.state || params.state !== pending.state) {
    throw new Error('Authentication failed: state mismatch');
  }

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId: cognitoClientId,
      code,
      redirectUri: pending.redirectUri,
      extraParams: { code_verifier: pending.codeVerifier },
    },
    discovery()
  );

  const idToken = tokenResponse.idToken;
  if (!idToken) {
    throw new Error('No ID token returned from Cognito. Check client configuration.');
  }

  return { idToken, accessToken: tokenResponse.accessToken };
}

/** @deprecated Use signInWithCognito */
export const signInWithCognitoGoogle = signInWithCognito;

/**
 * Cognito Hosted UI logout (best-effort). Always resolves and never throws. Callers should clear
 * the local session and navigate first, then run this in the background (`void`) — it opens a
 * browser tab that doesn't always auto-close on Android, so nothing should wait on it.
 */
export async function logoutFromCognito(): Promise<void> {
  if (!cognitoConfigured) return;
  const logoutUri = encodeURIComponent(cognitoLogoutUri);
  const url = `${cognitoDomain}/logout?client_id=${encodeURIComponent(cognitoClientId)}&logout_uri=${logoutUri}`;
  try {
    await withTimeout(
      WebBrowser.openAuthSessionAsync(url, cognitoLogoutUri, androidAuthSessionOptions()),
      LOGOUT_TIMEOUT_MS,
      'Logout timed out.'
    );
  } catch (e) {
    if (e instanceof WebBrowserTimeoutError) {
      bestEffortCloseBrowser();
    }
    /* still clear local session */
  }
}
