import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useMockApi } from './auth-config';

const MOCK_HOSTS = ['jsonplaceholder.typicode.com', 'your-railway-app.railway.app'];

/**
 * Public base URL (no trailing slash). Default Fastify: port 3000.
 * Mirrors Financial-Accounting `finance-app/constants/config.ts`: Expo Go on a device cannot use
 * `localhost` (that is the phone). Use Metro's host IP from Constants.
 */
export function getApiBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL?.trim();
  const ex = (Constants.expoConfig?.extra as { apiUrl?: string })?.apiUrl?.trim();
  let raw = env || ex || '';

  const executionEnvironment = (Constants as { executionEnvironment?: string }).executionEnvironment;
  const isExpoGo = executionEnvironment === 'storeClient';

  const isLoopbackHost = /localhost/i.test(raw) || /127\.0\.0\.1/.test(raw);

  if (raw && isLoopbackHost) {
    if (isExpoGo) {
      const hostUriCandidates = [
        Constants.expoConfig?.hostUri,
        (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost,
        (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2?.extra
          ?.expoClient?.hostUri,
      ];
      const hostUri = hostUriCandidates.find((v) => typeof v === 'string' && v.length > 0) as
        | string
        | undefined;
      if (hostUri) {
        const host = hostUri.replace(/^https?:\/\//, '').split('/')[0]?.split(':')[0];
        if (host) {
          const portMatch = raw.match(/:(\d+)/);
          const port = portMatch ? portMatch[1] : '3000';
          raw = `http://${host}:${port}`;
        }
      }
    } else if (Platform.OS === 'android') {
      // Android emulator: host loopback → special alias for dev machine
      raw = raw.replace(/127\.0\.0\.1|localhost/i, '10.0.2.2');
    }
  }

  return raw.replace(/\/$/, '');
}

function shouldUseMockResponses(baseUrl: string): boolean {
  if (useMockApi) return true;
  if (!baseUrl) return false;
  return MOCK_HOSTS.some((h) => baseUrl.includes(h));
}

// Mock response handler to prevent 404 errors
const handleMockResponse = (endpoint: string, method: string, data?: any) => {
  // Simulate successful responses for common endpoints
  const mockResponses: Record<string, any> = {
    '/api/campaigns': {
      campaigns: [],
      message: 'Campaigns fetched successfully'
    },
    '/api/campaigns/participations': {
      participations: [],
      message: 'Participations fetched successfully'
    },
    '/api/influencers/instagram-analytics': {
      analytics: null,
      message: 'Instagram analytics fetched'
    },
    '/api/influencers/youtube-analytics': {
      analytics: null,
      message: 'YouTube analytics fetched'
    },
    '/api/influencers/twitter-analytics': {
      analytics: null,
      message: 'Twitter analytics fetched'
    },
    '/api/ratings': {
      ratings: [],
      message: 'Ratings fetched successfully'
    },
    '/api/auth/reset-password': {
      message: 'Password reset email sent successfully'
    },
    '/api/auth/kinde/mobile-token-login': {
      token: 'mock-kinde-app-jwt',
      user: {
        id: 'mock-kinde-user-1',
        email: 'mock@example.com',
        firstName: 'Mock',
        lastName: 'User',
        isAffiliate: false,
      },
      tenant: { id: 'mock-tenant' },
      role: { id: 'mock-role', roleName: 'potential_influencer' },
      nextStep: 'COMPLETE_INFLUENCER_PROFILE',
    },
    '/api/auth/me': {
      user: {
        id: 'mock-kinde-user-1',
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
        nextStep: 'COMPLETE_INFLUENCER_PROFILE',
      },
      tenant: { id: 'mock-tenant' },
      role: { id: 'mock-role', roleName: 'potential_influencer' },
    },
    '/api/influencers/profile': {
      success: true,
      id: 'mock-inf',
      userId: 'mock-kinde-user-1',
      niche: 'general',
      country: 'US',
      bio: '',
      socialMedia: {},
      status: 'pending',
      metrics: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: 'mock-kinde-user-1',
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
  if (mockResponses[endpoint]) {
    return Promise.resolve(mockResponses[endpoint]);
  }

  // For other endpoints, return a generic success response
  return Promise.resolve({
    message: `${method} request to ${endpoint} successful`,
    data: data || {}
  });
};

class ApiClient {
  async getToken() {
    return await AsyncStorage.getItem('token');
  }

  async setToken(token: string) {
    await AsyncStorage.setItem('token', token);
  }

  async clearToken() {
    await AsyncStorage.removeItem('token');
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    
    // Only set Content-Type if not FormData
    const isFormData = options.body instanceof FormData;
    if (!isFormData) {
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

    console.log(`Making ${options.method || 'GET'} request to: ${API_URL}${endpoint}`);

    try {
      if (shouldUseMockResponses(API_URL)) {
        console.log('Using mock response for:', endpoint);
        return await handleMockResponse(endpoint, options.method || 'GET', options.body);
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
      
      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        console.log('Failed to parse JSON response, using empty object');
        data = {};
      }
      
      console.log(`Response status: ${response.status}, data:`, data);
      
      if (!response.ok) {
        // Log for debugging
        console.error('API error:', data, response.status);
        const errorMessage = (data as any).error || (data as any).message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      // Log for debugging
      console.log('API success:', data, response.status);
      return data;
    } catch (error: any) {
      console.error('Network error:', error);
      throw error;
    }
  }

  async get(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data: any, options: RequestInit = {}) {
    // Check if data is FormData
    const isFormData = data instanceof FormData;
    
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      headers: {
        ...(options.headers as Record<string, string> || {}),
        // Don't set Content-Type for FormData, let the browser set it with boundary
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      },
    });
  }

  async put(endpoint: string, data: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint: string, data: any, options: RequestInit = {}) {
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

// Content Progress Tracking APIs
export const contentProgressApi = {
  // Get progress for a campaign participation
  getProgress: async (participationId: string) => {
    const response = await api.get(`/api/campaigns/participation/${participationId}/progress`);
    return response;
  },

  // Submit content for a progress item
  submitContent: async (participationId: string, data: { progressId: string; contentUrl: string; contentType: string }) => {
    const response = await api.post(`/api/campaigns/participation/${participationId}/submit-content`, data);
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
  }
}; 