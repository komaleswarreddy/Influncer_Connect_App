import { create } from 'zustand';
import { api } from '../lib/api';

interface InfluencerAnalytics {
  id: string;
  influencerId: string;
  username: string;
  profilePictureUrl: string;
  followerCount: number;
  averageEngagementRate: number;
  malePercentage: number;
  femalePercentage: number;
  audienceDemographicsAgeRange: string;
  topAudienceLocation: string;
  isConnected: boolean;
  createdAt: string;
  updatedAt: string;
}

interface InfluencerState {
  instagramAnalytics: InfluencerAnalytics | null;
  youtubeAnalytics: InfluencerAnalytics | null;
  twitterAnalytics: InfluencerAnalytics | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  isYtConnected: boolean;
  isTwitterConnected: boolean;
  connectInstagram: (username: string) => Promise<void>;
  fetchInstagramAnalytics: () => Promise<void>;
  connectYouTube: (username: string) => Promise<void>;
  fetchYouTubeAnalytics: () => Promise<void>;
  connectTwitter: (username: string) => Promise<void>;
  fetchTwitterAnalytics: () => Promise<void>;
  clearError: () => void;
}

export const useInfluencerStore = create<InfluencerState>((set, get) => ({
  instagramAnalytics: null,
  youtubeAnalytics: null,
  twitterAnalytics: null,
  isLoading: false,
  error: null,
  isConnected: false,
  isYtConnected: false,
  isTwitterConnected: false,

  connectInstagram: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/influencers/connect-instagram', { username });
      const { analytics } = response;
      set({
        instagramAnalytics: analytics,
        isConnected: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  fetchInstagramAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/influencers/instagram-analytics');
      if (response.analytics) {
        set({
          instagramAnalytics: response.analytics,
          isConnected: true,
          isLoading: false
        });
      } else {
        set({ isConnected: false, isLoading: false });
      }
    } catch (error: any) {
      if (error.message !== 'Instagram not connected') {
        set({ error: 'Failed to fetch Instagram analytics.', isLoading: false });
      } else {
        set({ isConnected: false, isLoading: false });
      }
    }
  },

  connectYouTube: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/influencers/connect-youtube', { username });
      const { analytics } = response;
      set({
        youtubeAnalytics: analytics,
        isYtConnected: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  fetchYouTubeAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/influencers/youtube-analytics');
      if (response.analytics) {
        set({
          youtubeAnalytics: response.analytics,
          isYtConnected: true,
          isLoading: false
        });
      } else {
        set({ isYtConnected: false, isLoading: false });
      }
    } catch (error: any) {
      if (error.message !== 'YouTube not connected') {
        set({ error: 'Failed to fetch YouTube analytics.', isLoading: false });
      } else {
        set({ isYtConnected: false, isLoading: false });
      }
    }
  },

  connectTwitter: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/influencers/connect-twitter', { username });
      const { analytics } = response;
      set({
        twitterAnalytics: analytics,
        isTwitterConnected: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred.';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  fetchTwitterAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/influencers/twitter-analytics');
      if (response.analytics) {
        set({
          twitterAnalytics: response.analytics,
          isTwitterConnected: true,
          isLoading: false
        });
      } else {
        set({ isTwitterConnected: false, isLoading: false });
      }
    } catch (error: any) {
      if (error.message !== 'Twitter not connected') {
        set({ error: 'Failed to fetch Twitter analytics.', isLoading: false });
      } else {
        set({ isTwitterConnected: false, isLoading: false });
      }
    }
  },

  clearError: () => set({ error: null }),
})); 