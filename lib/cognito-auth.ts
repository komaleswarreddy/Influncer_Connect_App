import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
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
 * Cognito callback URIs must match the app client allowlist exactly.
 *
 * Allowlisted for affiliate-mobile-client:
 *   affiliateplatform://auth/callback
 *   exp://10.158.101.236:8081
 *   exp://10.158.101.236:8081/--/
 *
 * Expo Go + path `auth/callback` produces exp://IP:8081/--/auth/callback
 * which is NOT allowlisted → Cognito error page (redirect_mismatch).
 */
export function getCognitoRedirectUri(): string {
  // Dev client / standalone: custom scheme is registered and allowlisted.
  if (!isExpoGo) {
    return cognitoRedirectUri || 'affiliateplatform://auth/callback';
  }

  // Explicit exp:// override from env (must match Cognito exactly).
  if (
    cognitoRedirectUri.startsWith('exp://') &&
    !/\/auth\/callback\/?$/i.test(cognitoRedirectUri)
  ) {
    return cognitoRedirectUri;
  }

  // Expo Go: never append /auth/callback — Cognito only allows bare or /--/
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

/**
 * Open Cognito Hosted UI (same email/password screen as web), exchange code for tokens (PKCE).
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
  });

  const authUrl = await request.makeAuthUrlAsync(discovery());
  if (__DEV__) {
    console.log('[Cognito] authUrl=', authUrl);
  }

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Sign-in was cancelled');
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

/** Cognito Hosted UI logout (best-effort), then caller clears local session. */
export async function logoutFromCognito(): Promise<void> {
  if (!cognitoConfigured) return;
  const logoutUri = encodeURIComponent(cognitoLogoutUri);
  const url = `${cognitoDomain}/logout?client_id=${encodeURIComponent(cognitoClientId)}&logout_uri=${logoutUri}`;
  try {
    await WebBrowser.openAuthSessionAsync(url, cognitoLogoutUri);
  } catch {
    /* still clear local session */
  }
}
