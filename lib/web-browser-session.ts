import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

/**
 * Thrown when our own bounded wait gives up on a WebBrowser auth session —
 * NOT a user cancellation. Callers use this to show real feedback ("timed
 * out, try again") instead of silently swallowing it the way a genuine
 * cancel/dismiss is swallowed.
 */
export class WebBrowserTimeoutError extends Error {
  readonly code = 'WEB_BROWSER_TIMEOUT' as const;
  constructor(message: string) {
    super(message);
    this.name = 'WebBrowserTimeoutError';
  }
}

/**
 * Races `promise` against a timer. The original promise is NOT cancelled on
 * timeout (JS/native promises can't be) — it keeps running in the background
 * and its eventual result is simply discarded once we've moved on. This is a
 * deliberate trade-off: we prioritize returning control to the user within a
 * bounded window over ever "recovering" that late result.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new WebBrowserTimeoutError(timeoutMessage)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

/**
 * Best-effort attempt to get a stuck Custom Tab / ASWebAuthenticationSession
 * off the screen after we've given up waiting on it.
 *  - iOS: dismissAuthSession() is the documented, safe API.
 *  - Android: there is NO supported JS API to close a Custom Tab opened via
 *    openAuthSessionAsync (dismissAuthSession/dismissBrowser are iOS-only and
 *    throw UnavailabilityError on Android — fatal in a release build). We
 *    instead re-open the app's own bare scheme via Linking: MainActivity is
 *    launchMode="singleTask" and the Custom Tab is opened with
 *    createTask:false (same task), so this asks Android to bring the app's
 *    existing activity back to the front, which should surface it over the
 *    stuck tab. This is a plain, always-safe Linking call, but the visual
 *    "does it actually pop the tab" effect is an OS-behavior nudge, not a
 *    guaranteed/documented API — verify on a real device, don't treat it as
 *    a hard guarantee.
 */
export function bestEffortCloseBrowser(): void {
  if (Platform.OS === 'ios') {
    try {
      void WebBrowser.dismissAuthSession();
    } catch {
      /* ignore */
    }
    return;
  }
  if (Platform.OS === 'android') {
    void Linking.openURL('affiliateplatform://').catch(() => undefined);
  }
}
