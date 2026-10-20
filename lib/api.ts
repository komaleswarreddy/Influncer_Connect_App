import { clearSessionToken, getSessionToken, setSessionToken } from './secure-session';
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';
import { useMockApi } from './auth-config';

const SENSITIVE_KEYS = new Set([
  'token',
  'accessToken',
  'idToken',
  'refreshToken',
  'authorization',
]);

/** Deep-clones `value`, replacing any sensitive field (token/Authorization/etc.) with `[REDACTED]`. */
function redactSensitive(value: unknown, depth = 0): unknown {
  if (depth > 5 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redactSensitive(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEYS.has(key.toLowerCase())
      ? '[REDACTED]'
      : redactSensitive(val, depth + 1);
  }
  return out;
}

/** When the server last answered. The free-plan server sleeps after ~15 min idle, so a request after 10+ quiet minutes gets a long timeout. */
let lastServerOkAt = 0;
const SERVER_ASLEEP_AFTER_MS = 10 * 60 * 1000;

const MOCK_HOSTS = ['jsonplaceholder.typicode.com'];

/** Android emulator: host machine is reachable at 10.0.2.2. Physical devices must use LAN or adb reverse + 127.0.0.1. */
function isLikelyAndroidEmulator(): boolean {
  if (Platform.OS !== 'android') return false;
  const c = Platform.constants as {
    Fingerprint?: string;
    Model?: string;
  };
  const fp = (c.Fingerprint ?? '').toLowerCase();
  const model = (c.Model ?? '').toLowerCase();
  return (
    fp.includes('generic') ||
    fp.includes('unknown') ||
    fp.includes('test-keys') ||
    fp.includes('sdk_gphone') ||
    fp.includes('emulator') ||
    fp.includes('ranchu') ||
    fp.includes('goldfish') ||
    model.includes('sdk_gphone') ||
    model.includes('emulator')
  );
}

/**
 * Hostname of the machine serving the JS bundle (often LAN IP). Undefined if unavailable / loopback.
 */
function hostFromBundleScriptUrl(): string | undefined {
  const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
  if (!scriptURL || typeof scriptURL !== 'string') return undefined;
  try {
    const hostname = new URL(scriptURL).hostname;
    if (/^(localhost|127\.0\.0\.1)$/i.test(hostname)) return undefined;
    return hostname;
  } catch {
    return undefined;
  }
}

/**
 * Resolve localhost / 127.0.0.1 API URL to the dev PC when running on a device (Expo Go or dev client).
 * Order: Metro manifest host → bundle URL host (LAN) → Android: emulator uses 10.0.2.2; physical device uses
 * 127.0.0.1 so `adb reverse tcp:<port> tcp:<port>` (see `npm run adb:reverse`) forwards to the host.
 */
function resolveLoopbackApiBase(raw: string): string {
  const portMatch = raw.match(/:(\d+)/);
  const port = portMatch ? portMatch[1] : '3003';

  const hostUriCandidates = [
    Constants.expoConfig?.hostUri,
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost,
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2
      ?.extra?.expoClient?.hostUri,
  ];
  const hostUri = hostUriCandidates.find((v) => typeof v === 'string' && v.length > 0) as
    string | undefined;
  if (hostUri) {
    const host = hostUri
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      ?.split(':')[0];
    if (host && !/^(localhost|127\.0\.0\.1)$/i.test(host)) {
      return `http://${host}:${port}`;
    }
  }

  const bundleHost = hostFromBundleScriptUrl();
  if (bundleHost) {
    return `http://${bundleHost}:${port}`;
  }

  if (__DEV__ && Platform.OS === 'android') {
    if (isLikelyAndroidEmulator()) {
      return raw.replace(/127\.0\.0\.1|localhost/i, '10.0.2.2');
    }
    // Physical Android + USB dev: Metro often reports 127.0.0.1; use loopback API + `adb reverse` for port.
    return `http://127.0.0.1:${port}`;
  }

  return raw;
}

/**
 * Public base URL (no trailing slash). Default Fastify: port 3003.
 * `localhost` in EXPO_PUBLIC_API_URL is rewritten: LAN from Metro when possible; else Android emulator
 * uses 10.0.2.2, physical Android uses 127.0.0.1 (pair with `npm run adb:reverse` for API port).
 */
let warnedMissingApiUrl = false;

export function getApiBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL?.trim();
  const ex = (Constants.expoConfig?.extra as { apiUrl?: string })?.apiUrl?.trim();
  let raw = env || ex || '';

  // Local Expo Go / Metro must never hit Render — cold starts make login/signup feel broken.
  if (__DEV__ && /onrender\.com/i.test(raw)) {
    console.warn(
      '[api] EXPO_PUBLIC_API_URL points at Render in __DEV__. Forcing http://localhost:3003 ' +
        '(rewritten to Metro LAN / adb). Update mobile/.env for local testing.'
    );
    raw = 'http://localhost:3003';
  }

  if (!raw && !warnedMissingApiUrl) {
    warnedMissingApiUrl = true;
    console.warn(
      '[api] No API base URL configured. Set EXPO_PUBLIC_API_URL in mobile/.env ' +
        '(or extra.apiUrl in app.json for builds) — requests will fail until then.'
    );
  }

  const isLoopbackHost = /localhost/i.test(raw) || /127\.0\.0\.1/.test(raw);

  if (raw && isLoopbackHost) {
    raw = resolveLoopbackApiBase(raw);
  }

  return raw.replace(/\/$/, '');
}

function shouldUseMockResponses(baseUrl: string): boolean {
  if (useMockApi) return true;
  if (!baseUrl) return false;
  return MOCK_HOSTS.some((h) => baseUrl.includes(h));
}

// Mock response handler to prevent 404 errors
const handleMockResponse = (endpoint: string, method: string, data?: unknown) => {
  const pathOnly = endpoint.split('?')[0];
  // Simulate successful responses for common endpoints
  const mockResponses: Record<string, unknown> = {
    '/api/campaigns': {
      campaigns: [],
      message: 'Campaigns fetched successfully',
    },
    '/api/campaigns/participations': {
      participations: [],
      message: 'Participations fetched successfully',
    },
    '/api/influencers/instagram-analytics': {
      analytics: null,
      message: 'Instagram analytics fetched',
    },
    '/api/influencers/youtube-analytics': {
      analytics: null,
      message: 'YouTube analytics fetched',
    },
    '/api/influencers/twitter-analytics': {
      analytics: null,
      message: 'Twitter analytics fetched',
    },
    '/api/ratings': {
      ratings: [],
      message: 'Ratings fetched successfully',
    },
    '/api/auth/reset-password': {
      message: 'Password reset email sent successfully',
    },
    '/api/auth/cognito/mobile-token-login': {
      token: 'mock-cognito-app-jwt',
      user: {
        id: 'mock-cognito-user-1',
        email: 'mock@example.com',
        firstName: 'Mock',
        lastName: 'User',
        isAffiliate: false,
      },
      tenant: { id: 'mock-tenant' },
      role: { id: 'mock-role', roleName: 'potential_influencer' },
      nextStep: null,
    },
    '/api/content-ideas/trending': {
      success: true,
      ideas: [
        {
          title: 'Mock trend',
          hook: 'Try this hook today',
          hashtags: '#mock #creator',
          bestTime: '6 PM',
          rationale: 'Demo',
          contentType: 'reel',
        },
      ],
      cached: false,
      generatedAt: new Date().toISOString(),
    },
    '/api/push-tokens/register': { success: true },
    '/api/affiliates/tracking-links': { data: [] },
    '/api/affiliates/tracking-links/eligible-products': { data: [] },
    '/api/scheduled-posts/generate-caption': {
      suggestions: [
        { caption: 'Mock caption one', hashtags: '#demo' },
        { caption: 'Mock caption two', hashtags: '#test' },
      ],
    },
    '/api/auth/me': {
      user: {
        id: 'mock-cognito-user-1',
        email: 'mock@example.com',
        firstName: 'Mock',
        lastName: 'User',
        phone: null,
        countryCode: 'US',
        timezone: 'UTC',
        language: 'en',
        isAffiliate: false,
        role: 'potential_influencer',
        tenantId: 'mock-tenant',
        influencerStatus: 'pending',
        profileCompleted: false,
        nextStep: null,
      },
      tenant: { id: 'mock-tenant' },
      role: { id: 'mock-role', roleName: 'potential_influencer' },
    },
    '/api/influencers/campaign-matches': {
      success: true,
      matches: [],
    },
    '/api/campaign-invites/my': {
      success: true,
      invites: [],
    },
    '/api/campaign-invites/notifications/my': {
      success: true,
      unread: 0,
      notifications: [],
    },
    '/api/influencers/profile': {
      success: true,
      id: 'mock-inf',
      userId: 'mock-cognito-user-1',
      niche: 'general',
      country: 'US',
      bio: '',
      socialMedia: {},
      status: 'pending',
      metrics: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: 'mock-cognito-user-1',
        email: 'mock@example.com',
        firstName: 'Mock',
        lastName: 'User',
        phone: '',
        countryCode: 'US',
        tenantId: 'mock-tenant',
      },
    },
  };

  // Return mock response if endpoint exists
  if (mockResponses[endpoint] || mockResponses[pathOnly]) {
    return Promise.resolve(mockResponses[endpoint] ?? mockResponses[pathOnly]);
  }

  // For other endpoints, return a generic success response
  return Promise.resolve({
    message: `${method} request to ${endpoint} successful`,
    data: data || {},
  });
};

class ApiClient {
  private isAnalyticsEndpoint(endpoint: string): boolean {
    return /\/api\/influencers\/(instagram|youtube|twitter)-analytics/.test(endpoint);
  }

  private isExpectedNotConnected(endpoint: string, status: number, data: unknown): boolean {
    if (status !== 404) return false;
    if (!/\/api\/influencers\/(instagram|youtube|twitter)-analytics/.test(endpoint)) return false;
    const msg =
      data && typeof data === 'object'
        ? String(
            (data as { error?: string; message?: string }).error ??
              (data as { error?: string; message?: string }).message ??
              ''
          )
        : '';
    return /not connected/i.test(msg);
  }

  async getToken() {
    return await getSessionToken();
  }

  async setToken(token: string) {
    await setSessionToken(token);
  }

  async clearToken() {
    await clearSessionToken();
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    // Fastify rejects DELETE/GET with Content-Type: application/json and an empty body (FST_ERR_CTP_EMPTY_JSON_BODY).
    const body = options.body;
    if (body instanceof FormData) {
      // RN/fetch sets multipart boundary
    } else if (body !== undefined && body !== null) {
      headers['Content-Type'] = 'application/json';
    }

    const token = await this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const API_URL = getApiBaseUrl();

    if (!API_URL) {
      throw new Error(
        'API base URL is not set. Copy mobile/.env.example to mobile/.env and set EXPO_PUBLIC_API_URL.'
      );
    }

    if (__DEV__) {
      console.log(`Making ${options.method || 'GET'} request to: ${API_URL}${endpoint}`);
    }

    try {
      if (shouldUseMockResponses(API_URL)) {
        console.log('Using mock response for:', endpoint);
        return await handleMockResponse(endpoint, options.method || 'GET', options.body);
      }

      const controller = new AbortController();
      // Sign-in / sign-up get the longest allowance: the first request after the (free-plan) server has slept can take ~1 minute.
      // The same goes for any request after a quiet spell (the server sleeps after ~15 min idle and needs ~1 minute to wake).
      const serverMaybeAsleep = Date.now() - lastServerOkAt > SERVER_ASLEEP_AFTER_MS;
      const timeoutMs =
        endpoint.startsWith('/api/auth/') || serverMaybeAsleep
          ? 75000
          : endpoint.includes('/api/content-ideas/trending') ||
              endpoint.includes('/api/scheduled-posts/generate-caption')
            ? 60000
            : 30000;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal,
        });
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('The request timed out. Your connection may be slow — please try again.');
        }
        throw fetchError;
      } finally {
        clearTimeout(timeout);
      }

      lastServerOkAt = Date.now();
      let data = {};
      try {
        data = await response.json();
      } catch {
        console.log('Failed to parse JSON response, using empty object');
        data = {};
      }

      if (__DEV__) {
        console.log(`Response status: ${response.status}, data:`, redactSensitive(data));
      }

      if (!response.ok) {
        const expectedNotConnected = this.isExpectedNotConnected(endpoint, response.status, data);
        const suppressAnalyticsServerError =
          this.isAnalyticsEndpoint(endpoint) && response.status >= 500;
        if (expectedNotConnected) {
          console.log('API info (not connected yet):', data, response.status);
        } else if (suppressAnalyticsServerError) {
          // Temporary suppression: avoid noisy redbox for transient analytics backend errors.
          console.log('API info (analytics temporarily unavailable):', data, response.status);
        } else if (__DEV__) {
          console.error('API error:', redactSensitive(data), response.status);
        }
        const payload = data as { error?: string; message?: string };
        const detail =
          typeof payload.message === 'string' && payload.message.trim()
            ? payload.message.trim()
            : typeof payload.error === 'string' && payload.error.trim()
              ? payload.error.trim()
              : '';
        const errorMessage = detail || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Log for debugging
      if (__DEV__) {
        console.log('API success:', redactSensitive(data), response.status);
      }
      return data;
    } catch (error: unknown) {
      const expectedNotConnected = this.isExpectedNotConnected(endpoint, 404, {
        error: error instanceof Error ? error.message : String(error),
      });
      if (!expectedNotConnected) {
        console.error('Network error:', error);
      } else {
        console.log(
          'Network info (not connected yet):',
          error instanceof Error ? error.message : String(error)
        );
      }
      throw error;
    }
  }

  async get(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data: unknown, options: RequestInit = {}) {
    // Check if data is FormData
    const isFormData = data instanceof FormData;

    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      headers: {
        ...((options.headers as Record<string, string>) || {}),
        // Don't set Content-Type for FormData, let the browser set it with boundary
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      },
    });
  }

  async put(endpoint: string, data: unknown, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint: string, data: unknown, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();

/** Pings the health route so a sleeping server starts waking while the person is still looking at the screen. Never throws. */
export async function wakeServer(): Promise<void> {
  const base = getApiBaseUrl();
  if (!base || Date.now() - lastServerOkAt < SERVER_ASLEEP_AFTER_MS / 2) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 75000);
  try {
    const res = await fetch(`${base}/api/health`, { signal: controller.signal });
    if (res.ok) lastServerOkAt = Date.now();
  } catch {
    // the real requests will report any problem
  } finally {
    clearTimeout(timer);
  }
}

// Content Progress Tracking APIs
export const contentProgressApi = {
  // Get progress for a campaign participation
  getProgress: async (participationId: string) => {
    const response = await api.get(`/api/campaigns/participation/${participationId}/progress`);
    return response;
  },

  // Submit content for a progress item
  submitContent: async (
    participationId: string,
    data: {
      progressId: string;
      contentUrl: string;
      contentType: string;
      analysisId?: string | null;
    }
  ) => {
    const response = await api.post(
      `/api/campaigns/participation/${participationId}/submit-content`,
      data
    );
    return response;
  },

  // Update a submission
  updateSubmission: async (submissionId: string, data: { contentUrl: string }) => {
    const response = await api.put(`/api/campaigns/submission/${submissionId}`, data);
    return response;
  },

  // Delete a submission
  deleteSubmission: async (submissionId: string) => {
    const response = await api.delete(`/api/campaigns/submission/${submissionId}`);
    return response;
  },
};
