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

// --- Additions for Ratings ---
interface CampaignRating {
  id: string;
  participationId: string;
  campaignId: string;
  reviewerId: string;
  ratedEntityId: string;
  ratingType: 'influencer_to_campaign' | 'admin_to_influencer';
  overallRating: number;
  review?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface RatingsState {
  ratings: Record<string, CampaignRating | undefined>; // participationId -> rating
  adminRatings: Record<string, CampaignRating[]>; // participationId -> admin ratings
  ratingsLoading: boolean;
  ratingsError: string | null;
  fetchRatings: (participationId: string) => Promise<void>;
  submitRating: (participationId: string, overallRating: number, review?: string) => Promise<void>;
  fetchAdminRatings: (influencerId: string, campaignId: string, participationId: string) => Promise<void>;
}

// Extend the store
export const useInfluencerStore = create<InfluencerState & RatingsState>((set, get) => ({
  instagramAnalytics: null,
  youtubeAnalytics: null,
  twitterAnalytics: null,
  isLoading: false,
  error: null,
  isConnected: false,
  isYtConnected: false,
  isTwitterConnected: false,
  ratings: {},
  adminRatings: {},
  ratingsLoading: false,
  ratingsError: null,

  connectInstagram: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/influencers/connect-instagram', { username });
      const { analytics } = response as { analytics: InfluencerAnalytics };
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
      const { analytics } = response as { analytics?: InfluencerAnalytics };
      if (analytics) {
        set({
          instagramAnalytics: analytics,
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
      const { analytics } = response as { analytics: InfluencerAnalytics };
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
      const { analytics } = response as { analytics?: InfluencerAnalytics };
      if (analytics) {
        set({
          youtubeAnalytics: analytics,
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
      const { analytics } = response as { analytics: InfluencerAnalytics };
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
      const { analytics } = response as { analytics?: InfluencerAnalytics };
      if (analytics) {
        set({
          twitterAnalytics: analytics,
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

  fetchRatings: async (participationId: string) => {
    set({ ratingsLoading: true, ratingsError: null });
    try {
      const response = await api.get(`/api/ratings?participationId=${participationId}&ratingType=influencer_to_campaign`);
      const rating = Array.isArray(response) ? response.find((r: any) => r.participationId === participationId) : undefined;
      set((state) => ({ ratings: { ...state.ratings, [participationId]: rating }, ratingsLoading: false }));
    } catch (error: any) {
      set({ ratingsError: error.message || 'Failed to fetch ratings', ratingsLoading: false });
    }
  },

  submitRating: async (participationId: string, overallRating: number, review?: string) => {
    set({ ratingsLoading: true, ratingsError: null });
    try {
      await api.post('/api/ratings/create', {
        participationId,
        overallRating,
        review,
        ratingType: 'influencer_to_campaign',
      });
      await get().fetchRatings(participationId);
      set({ ratingsLoading: false });
    } catch (error: any) {
      set({ ratingsError: error.message || 'Failed to submit rating', ratingsLoading: false });
      throw error;
    }
  },

  fetchAdminRatings: async (influencerId: string, campaignId: string, participationId: string) => {
    set({ ratingsLoading: true, ratingsError: null });
    try {
      const response = await api.get(`/api/ratings/influencer/${influencerId}?campaignId=${campaignId}`);
      const { ratings } = response as { ratings?: CampaignRating[] };
      set((state) => ({ adminRatings: { ...state.adminRatings, [participationId]: ratings || [] }, ratingsLoading: false }));
    } catch (error: any) {
      set({ ratingsError: error.message || 'Failed to fetch admin ratings', ratingsLoading: false });
    }
  },

  clearError: () => set({ error: null }),
})); 