/**
 * Rewrite OS deep links before Expo Router matches them.
 * Cognito returns affiliateplatform://auth/callback?... — without a real route
 * that becomes +not-found ("Oops! / This screen does not exist").
 *
 * `path` here is whatever Expo Router extracted after the scheme+host, so we
 * validate it as a real path (not a loose substring test) before rewriting —
 * an attacker-controlled deep link like affiliateplatform://evil/foo/auth/callback/bar
 * must NOT be treated as our OAuth callback.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const [pathname, query = ''] = (() => {
      const qIndex = normalized.indexOf('?');
      return qIndex >= 0
        ? [normalized.slice(0, qIndex), normalized.slice(qIndex)]
        : [normalized, ''];
    })();

    // Require the path to BE (not merely contain) /auth/callback, with an optional trailing slash.
    if (/^\/auth\/callback\/?$/i.test(pathname)) {
      return `/auth/callback${query}`;
    }
    if (/^\/instagram-connected\/?$/i.test(pathname)) {
      return '/account-screens/dm-automation';
    }
    return path;
  } catch {
    return '/';
  }
}
