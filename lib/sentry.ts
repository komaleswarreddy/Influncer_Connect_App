import type { ComponentType } from 'react';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

/** Env wins (EAS / Metro inlines EXPO_PUBLIC_*); `extra` from app.config.js is fallback —
 * same precedence as apiUrl/cognitoDomain in lib/auth-config.ts. Unset means Sentry stays
 * fully disabled ("degrades gracefully when unconfigured", same pattern as Cognito). */
const extra = (Constants.expoConfig?.extra ?? {}) as { sentryDsn?: string };
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || extra.sentryDsn?.trim() || '';

export const sentryConfigured = dsn.length > 0;

let initialized = false;

/** Call once, as early as possible (top of app/_layout.tsx). No-op without a DSN. */
export function initSentry(): void {
  if (initialized) return;
  initialized = true;
  if (!sentryConfigured) {
    console.log('[sentry] No EXPO_PUBLIC_SENTRY_DSN set — crash reporting disabled.');
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_ENV || (__DEV__ ? 'development' : 'production'),
    enableAutoSessionTracking: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  });
}

/** Wraps the root component to add React lifecycle breadcrumbs and touch-event tracking.
 * A no-op passthrough when Sentry isn't configured. */
export function wrapWithSentry<P extends Record<string, unknown>>(
  component: ComponentType<P>
): ComponentType<P> {
  return sentryConfigured ? Sentry.wrap(component) : component;
}
