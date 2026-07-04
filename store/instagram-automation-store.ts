import { create } from 'zustand';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
  instagramAutomationApi,
  type InstagramConnection,
  type DmAutomation,
  type SummaryStats,
  type CreateAutomationPayload,
} from '@/lib/instagram-automation-api';

WebBrowser.maybeCompleteAuthSession();

/** Must match app.json `scheme` and backend INSTAGRAM_MOBILE_DEEP_LINK. */
function getInstagramOAuthRedirect(): string {
  const created = Linking.createURL('instagram-connected');
  if (typeof created === 'string' && created.startsWith('affiliateplatform://')) {
    return created;
  }
  return 'affiliateplatform://instagram-connected';
}

function assertValidOAuthUrl(url: unknown, label: string): string {
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error(
      `${label} is missing. Ensure the API server is running and EXPO_PUBLIC_API_URL reaches it (use LAN IP or adb reverse on Android).`
    );
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('unsupported protocol');
    }
    return url;
  } catch {
    throw new Error(`${label} is invalid. Try again after restarting the API and tunnel.`);
  }
}

interface InstagramAutomationState {
  connection: InstagramConnection | null;
  isConnected: boolean;
  automations: DmAutomation[];
  summaryStats: SummaryStats | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchConnectionStatus: () => Promise<void>;
  connectInstagram: () => Promise<void>;
  disconnectInstagram: () => Promise<void>;
  fetchAutomations: () => Promise<void>;
  fetchSummaryStats: () => Promise<void>;
  createAutomation: (data: CreateAutomationPayload) => Promise<DmAutomation>;
  updateAutomation: (id: string, data: CreateAutomationPayload) => Promise<DmAutomation>;
  toggleAutomation: (id: string) => Promise<void>;
  deleteAutomation: (id: string) => Promise<void>;
  previewAi: (aiContext: string, sampleMessage: string) => Promise<string | null>;
  clearError: () => void;
}

export const useInstagramAutomationStore = create<InstagramAutomationState>((set, get) => ({
  connection: null,
  isConnected: false,
  automations: [],
  summaryStats: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchConnectionStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await instagramAutomationApi.getConnectionStatus();
      set({
        isConnected: res.connected,
        connection: res.connection ?? null,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load connection status',
        isLoading: false,
      });
    }
  },

  connectInstagram: async () => {
    set({ isSaving: true, error: null });
    try {
      const response = await instagramAutomationApi.getConnectUrl();
      const authUrl = assertValidOAuthUrl(response.authUrl, 'Instagram auth URL');
      const result = await WebBrowser.openAuthSessionAsync(authUrl, getInstagramOAuthRedirect(), {
        ...(Platform.OS === 'android' ? { createTask: false } : {}),
        showInRecents: false,
      });

      if (result.type === 'success' && result.url) {
        let success = false;
        let errorMessage = '';
        try {
          const parsed = new URL(result.url);
          success = parsed.searchParams.get('success') === '1';
          errorMessage = parsed.searchParams.get('error') || '';
        } catch {
          success = result.url.includes('success=1');
        }

        if (success) {
          await get().fetchConnectionStatus();
          if (get().isConnected) {
            await Promise.all([get().fetchAutomations(), get().fetchSummaryStats()]);
          }
        } else if (errorMessage) {
          throw new Error(decodeURIComponent(errorMessage.replace(/\+/g, ' ')));
        }
      }

      set({ isSaving: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to start Instagram connect',
        isSaving: false,
      });
      throw err;
    }
  },

  disconnectInstagram: async () => {
    set({ isSaving: true, error: null });
    try {
      await instagramAutomationApi.disconnect();
      set({
        isConnected: false,
        connection: null,
        automations: [],
        summaryStats: null,
        isSaving: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to disconnect Instagram',
        isSaving: false,
      });
      throw err;
    }
  },

  fetchAutomations: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await instagramAutomationApi.getAutomations();
      set({ automations: res.automations, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load automations',
        isLoading: false,
      });
    }
  },

  fetchSummaryStats: async () => {
    try {
      const summaryStats = await instagramAutomationApi.getSummaryStats();
      set({ summaryStats });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load stats',
      });
    }
  },

  createAutomation: async (data) => {
    set({ isSaving: true, error: null });
    try {
      const res = await instagramAutomationApi.createAutomation(data);
      const automations = [...get().automations, res.automation];
      set({ automations, isSaving: false });
      return res.automation;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create automation',
        isSaving: false,
      });
      throw err;
    }
  },

  updateAutomation: async (id, data) => {
    set({ isSaving: true, error: null });
    try {
      const res = await instagramAutomationApi.updateAutomation(id, data);
      const automations = get().automations.map((a) => (a.id === id ? res.automation : a));
      set({ automations, isSaving: false });
      return res.automation;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update automation',
        isSaving: false,
      });
      throw err;
    }
  },

  toggleAutomation: async (id) => {
    set({ isSaving: true, error: null });
    try {
      const res = await instagramAutomationApi.toggleAutomation(id);
      const automations = get().automations.map((a) => (a.id === id ? res.automation : a));
      set({ automations, isSaving: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to toggle automation',
        isSaving: false,
      });
      throw err;
    }
  },

  deleteAutomation: async (id) => {
    set({ isSaving: true, error: null });
    try {
      await instagramAutomationApi.deleteAutomation(id);
      const automations = get().automations.filter((a) => a.id !== id);
      set({ automations, isSaving: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete automation',
        isSaving: false,
      });
      throw err;
    }
  },

  previewAi: async (aiContext, sampleMessage) => {
    try {
      const res = await instagramAutomationApi.previewAi(aiContext, sampleMessage);
      return res.preview;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to preview AI reply',
      });
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));
