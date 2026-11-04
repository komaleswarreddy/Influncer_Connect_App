import type { ComponentType } from 'react';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

/** Env wins (EAS / Metro inlines EXPO_PUBLIC_*); `extra` from app.config.js is fallback —
 * same precedence as apiUrl/cognitoDomain in lib/auth-config.ts. Unset means Sentry stays
 * fully disabled ("degrades gracefully when unconfigured", same pattern as Cognito). */
const extra = (Constants.expoConfig?.extra ?? {}) as { sentryDsn?: string };
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || extra.sentryDsn?.trim() || '';

export const sentryConfigured = dsn.length > 0;

const SENSITIVE_QUERY =
  /([?&#](?:access_token|id_token|refresh_token|token|code|key|api_key|apikey|secret|password|signature|sig|auth)=)[^&#\s]*/gi;
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'proxy-authorization',
]);

function scrubUrl(url: unknown): unknown {
  return typeof url === 'string' ? url.replace(SENSITIVE_QUERY, '$1[Filtered]') : url;
}

function scrubHeaders(headers: unknown): unknown {
  if (!headers || typeof headers !== 'object') return headers;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
    out[k] = SENSITIVE_HEADERS.has(k.toLowerCase()) ? '[Filtered]' : v;
  }
  return out;
}

/** Strip auth headers, cookies, request bodies and token-looking query params before anything leaves the device. */
function scrubEvent<T extends Sentry.ErrorEvent | Sentry.TransactionEvent>(event: T): T {
  const req = event.request;
  if (req) {
    req.url = scrubUrl(req.url) as string | undefined;
    if (req.headers) req.headers = scrubHeaders(req.headers) as typeof req.headers;
    delete req.cookies;
    delete req.data;
    if (typeof req.query_string === 'string')
      req.query_string = scrubUrl(`?${req.query_string}`)?.toString().slice(1);
  }
  return event;
}

function scrubBreadcrumb(b: Sentry.Breadcrumb): Sentry.Breadcrumb {
  if (b.data && typeof b.data === 'object') {
    const d = { ...(b.data as Record<string, unknown>) };
    if ('url' in d) d.url = scrubUrl(d.url);
    if ('to' in d) d.to = scrubUrl(d.to);
    if ('from' in d) d.from = scrubUrl(d.from);
    delete d.request_body;
    delete d.response_body;
    delete d.body;
    b.data = d;
  }
  return b;
}

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
    sendDefaultPii: false,
    beforeSend: (event) => scrubEvent(event),
    beforeSendTransaction: (event) => scrubEvent(event),
    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
  });
}

/** Wraps the root component to add React lifecycle breadcrumbs and touch-event tracking.
 * A no-op passthrough when Sentry isn't configured. */
export function wrapWithSentry<P extends Record<string, unknown>>(
  component: ComponentType<P>
): ComponentType<P> {
  return sentryConfigured ? Sentry.wrap(component) : component;
}
