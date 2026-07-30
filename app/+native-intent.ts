/**
 * Rewrite OS deep links before Expo Router matches them.
 * Cognito returns affiliateplatform://auth/callback?... — without a real route
 * that becomes +not-found ("Oops! / This screen does not exist").
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    if (/auth\/callback/i.test(normalized)) {
      // Keep query string so AuthSession can still read it if needed.
      const qIndex = normalized.indexOf('?');
      const query = qIndex >= 0 ? normalized.slice(qIndex) : '';
      return `/auth/callback${query}`;
    }
    if (/instagram-connected/i.test(normalized)) {
      return '/account-screens/dm-automation';
    }
    return path;
  } catch {
    return '/';
  }
}
