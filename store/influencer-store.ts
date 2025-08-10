import { create } from 'zustand';
import { api } from '../lib/api';
import { 
  mockInstagramAnalytics, 
  mockYouTubeAnalytics, 
  mockTwitterAnalytics,
  mockRatings,
  mockAdminRatings
} from '../lib/mock-data';

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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data
      set({
        instagramAnalytics: mockInstagramAnalytics,
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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Use mock data
      set({
        instagramAnalytics: mockInstagramAnalytics,
        isConnected: true,
        isLoading: false
      });
    } catch (error: any) {
      set({ error: 'Failed to fetch Instagram analytics.', isLoading: false });
    }
  },

  connectYouTube: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data
      set({
        youtubeAnalytics: mockYouTubeAnalytics,
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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Use mock data
      set({
        youtubeAnalytics: mockYouTubeAnalytics,
        isYtConnected: true,
        isLoading: false
      });
    } catch (error: any) {
      set({ error: 'Failed to fetch YouTube analytics.', isLoading: false });
    }
  },

  connectTwitter: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data
      set({
        twitterAnalytics: mockTwitterAnalytics,
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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Use mock data
      set({
        twitterAnalytics: mockTwitterAnalytics,
        isTwitterConnected: true,
        isLoading: false
      });
    } catch (error: any) {
      set({ error: 'Failed to fetch Twitter analytics.', isLoading: false });
    }
  },

  fetchRatings: async (participationId: string) => {
    set({ ratingsLoading: true, ratingsError: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find rating in mock data
      const rating = mockRatings.find(r => r.participationId === participationId);
      set((state) => ({ 
        ratings: { ...state.ratings, [participationId]: rating }, 
        ratingsLoading: false 
      }));
    } catch (error: any) {
      set({ ratingsError: error.message || 'Failed to fetch ratings', ratingsLoading: false });
    }
  },

  submitRating: async (participationId: string, overallRating: number, review?: string) => {
    set({ ratingsLoading: true, ratingsError: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Create new rating
      const newRating: CampaignRating = {
        id: `rating-${Date.now()}`,
        participationId,
        campaignId: '1', // Mock campaign ID
        reviewerId: '1',
        ratedEntityId: '1',
        ratingType: 'influencer_to_campaign',
        overallRating,
        review,
        status: 'approved',
        createdAt: new Date().toISOString()
      };
      
      // Update ratings
      set((state) => ({
        ratings: { ...state.ratings, [participationId]: newRating },
        ratingsLoading: false
      }));
    } catch (error: any) {
      set({ ratingsError: error.message || 'Failed to submit rating', ratingsLoading: false });
      throw error;
    }
  },

  fetchAdminRatings: async (influencerId: string, campaignId: string, participationId: string) => {
    set({ ratingsLoading: true, ratingsError: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use mock admin ratings
      const adminRatings = mockAdminRatings.filter(r => r.participationId === participationId);
      set((state) => ({ 
        adminRatings: { ...state.adminRatings, [participationId]: adminRatings }, 
        ratingsLoading: false 
      }));
    } catch (error: any) {
      set({ ratingsError: error.message || 'Failed to fetch admin ratings', ratingsLoading: false });
    }
  },

  clearError: () => set({ error: null }),
})); 