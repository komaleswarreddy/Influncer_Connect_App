import { create } from 'zustand';
import { api } from '../lib/api';
import {
  mockInstagramAnalytics,
  mockYouTubeAnalytics,
  mockTwitterAnalytics,
  mockRatings,
  mockAdminRatings,
} from '../lib/mock-data';
import { useMockApi } from '../lib/auth-config';
import {
  mapAnalyticsRow,
  isAnalyticsNotFoundError,
  type InfluencerAnalyticsRow,
} from '../lib/influencer-analytics-map';

export type CampaignMatchItem = {
  campaignId: string;
  name: string;
  score: number;
  nicheMatch: boolean;
  socialMatch: boolean;
  reachHint: string | null;
};

interface InfluencerState {
  instagramAnalytics: InfluencerAnalyticsRow | null;
  youtubeAnalytics: InfluencerAnalyticsRow | null;
  twitterAnalytics: InfluencerAnalyticsRow | null;
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
  fetchCampaignMatches: () => Promise<void>;
  clearError: () => void;
}

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

function mapApiRowToCampaignRating(r: Record<string, unknown>): CampaignRating {
  const created = r.createdAt;
  const createdStr =
    created instanceof Date
      ? created.toISOString()
      : typeof created === 'string'
        ? created
        : '';
  return {
    id: String(r.id),
    participationId: String(r.participationId),
    campaignId: String(r.campaignId),
    reviewerId: String(r.reviewerId),
    ratedEntityId: String(r.ratedEntityId),
    ratingType: r.ratingType as CampaignRating['ratingType'],
    overallRating: Number(r.overallRating),
    review: typeof r.review === 'string' && r.review.length > 0 ? r.review : undefined,
    status: r.status as CampaignRating['status'],
    createdAt: createdStr,
  };
}

interface RatingsState {
  ratings: Record<string, CampaignRating | undefined>;
  adminRatings: Record<string, CampaignRating[]>;
  ratingsLoading: boolean;
  ratingsError: string | null;
  campaignMatches: CampaignMatchItem[];
  campaignMatchesLoading: boolean;
  campaignMatchesError: string | null;
  fetchRatings: (participationId: string) => Promise<void>;
  submitRating: (participationId: string, overallRating: number, review?: string) => Promise<void>;
  fetchBrandRatings: (influencerId: string, campaignId: string, participationId: string) => Promise<void>;
}

function recomputeFlags(set: (partial: Partial<InfluencerState>) => void, get: () => InfluencerState) {
  const s = get();
  set({
    isConnected: !!s.instagramAnalytics?.isConnected,
    isYtConnected: !!s.youtubeAnalytics?.isConnected,
    isTwitterConnected: !!s.twitterAnalytics?.isConnected,
  });
}

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
  campaignMatches: [],
  campaignMatchesLoading: false,
  campaignMatchesError: null,

  connectInstagram: async (username: string) => {
    void username;
    set({ isLoading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      set({
        instagramAnalytics: mapAnalyticsRow(mockInstagramAnalytics as unknown as Record<string, unknown>),
        isConnected: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  fetchInstagramAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      if (useMockApi) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        set({
          instagramAnalytics: mapAnalyticsRow(mockInstagramAnalytics as unknown as Record<string, unknown>),
          isConnected: true,
          isLoading: false,
        });
        recomputeFlags(set, get);
        return;
      }
      try {
        const data = (await api.get('/api/influencers/instagram-analytics')) as {
          analytics?: Record<string, unknown>;
        };
        const row = mapAnalyticsRow(data.analytics);
        set({
          instagramAnalytics: row,
          isConnected: !!row?.isConnected,
          isLoading: false,
        });
      } catch (e: unknown) {
        if (isAnalyticsNotFoundError(e)) {
          set({ instagramAnalytics: null, isLoading: false });
        } else {
          // Temporary silent fallback: do not surface noisy alerts/popups for analytics fetch failures.
          set({ instagramAnalytics: null, isLoading: false });
        }
      }
    } catch {
          set({ instagramAnalytics: null, isLoading: false });
    }
    recomputeFlags(set, get);
  },

  connectYouTube: async (username: string) => {
    void username;
    set({ isLoading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      set({
        youtubeAnalytics: mapAnalyticsRow(mockYouTubeAnalytics as unknown as Record<string, unknown>),
        isYtConnected: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  fetchYouTubeAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      if (useMockApi) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        set({
          youtubeAnalytics: mapAnalyticsRow(mockYouTubeAnalytics as unknown as Record<string, unknown>),
          isYtConnected: true,
          isLoading: false,
        });
        recomputeFlags(set, get);
        return;
      }
      try {
        const data = (await api.get('/api/influencers/youtube-analytics')) as {
          analytics?: Record<string, unknown>;
        };
        const row = mapAnalyticsRow(data.analytics);
        set({
          youtubeAnalytics: row,
          isYtConnected: !!row?.isConnected,
          isLoading: false,
        });
      } catch (e: unknown) {
        if (isAnalyticsNotFoundError(e)) {
          set({ youtubeAnalytics: null, isLoading: false });
        } else {
          set({ youtubeAnalytics: null, isLoading: false });
        }
      }
    } catch {
      set({ youtubeAnalytics: null, isLoading: false });
    }
    recomputeFlags(set, get);
  },

  connectTwitter: async (username: string) => {
    void username;
    set({ isLoading: true, error: null });
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      set({
        twitterAnalytics: mapAnalyticsRow(mockTwitterAnalytics as unknown as Record<string, unknown>),
        isTwitterConnected: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  fetchTwitterAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      if (useMockApi) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        set({
          twitterAnalytics: mapAnalyticsRow(mockTwitterAnalytics as unknown as Record<string, unknown>),
          isTwitterConnected: true,
          isLoading: false,
        });
        recomputeFlags(set, get);
        return;
      }
      try {
        const data = (await api.get('/api/influencers/twitter-analytics')) as {
          analytics?: Record<string, unknown>;
        };
        const row = mapAnalyticsRow(data.analytics);
        set({
          twitterAnalytics: row,
          isTwitterConnected: !!row?.isConnected,
          isLoading: false,
        });
      } catch (e: unknown) {
        if (isAnalyticsNotFoundError(e)) {
          set({ twitterAnalytics: null, isLoading: false });
        } else {
          set({ twitterAnalytics: null, isLoading: false });
        }
      }
    } catch {
      set({ twitterAnalytics: null, isLoading: false });
    }
    recomputeFlags(set, get);
  },

  fetchCampaignMatches: async () => {
    if (useMockApi) {
      set({ campaignMatches: [], campaignMatchesLoading: false, campaignMatchesError: null });
      return;
    }
    set({ campaignMatchesLoading: true, campaignMatchesError: null });
    try {
      const data = (await api.get('/api/influencers/campaign-matches')) as {
        matches?: CampaignMatchItem[];
      };
      set({
        campaignMatches: data.matches ?? [],
        campaignMatchesLoading: false,
      });
    } catch (e: unknown) {
      set({
        campaignMatchesError: e instanceof Error ? e.message : 'Failed to load matches',
        campaignMatchesLoading: false,
      });
    }
  },

  fetchRatings: async (participationId: string) => {
    if (useMockApi) {
      set({ ratingsError: null });
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const rating = mockRatings.find((r) => r.participationId === participationId) as
          | CampaignRating
          | undefined;
        set((state) => ({
          ratings: { ...state.ratings, [participationId]: rating },
        }));
      } catch (error: unknown) {
        set({
          ratingsError: error instanceof Error ? error.message : 'Failed to fetch ratings',
        });
      }
      return;
    }

    set({ ratingsError: null });
    try {
      const query = new URLSearchParams({
        participationId,
        ratingType: 'influencer_to_campaign',
        limit: '10',
      });
      const raw = (await api.get(`/api/ratings?${query.toString()}`)) as unknown;
      const list = Array.isArray(raw) ? raw : [];
      const row = list[0] as Record<string, unknown> | undefined;
      const rating = row ? mapApiRowToCampaignRating(row) : undefined;
      set((state) => ({
        ratings: { ...state.ratings, [participationId]: rating },
      }));
    } catch (error: unknown) {
      set({
        ratingsError: error instanceof Error ? error.message : 'Failed to fetch ratings',
      });
    }
  },

  submitRating: async (participationId: string, overallRating: number, review?: string) => {
    set({ ratingsLoading: true, ratingsError: null });
    try {
      if (useMockApi) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const newRating: CampaignRating = {
          id: `rating-${Date.now()}`,
          participationId,
          campaignId: '1',
          reviewerId: '1',
          ratedEntityId: '1',
          ratingType: 'influencer_to_campaign',
          overallRating,
          review,
          status: 'approved',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          ratings: { ...state.ratings, [participationId]: newRating },
          ratingsLoading: false,
        }));
        return;
      }

      await api.post('/api/ratings/create', {
        participationId,
        overallRating,
        review: review?.trim() ? review.trim() : undefined,
        ratingType: 'influencer_to_campaign',
      });
      await get().fetchRatings(participationId);
      set({ ratingsLoading: false });
    } catch (error: unknown) {
      set({
        ratingsError: error instanceof Error ? error.message : 'Failed to submit rating',
        ratingsLoading: false,
      });
      throw error;
    }
  },

  fetchBrandRatings: async (influencerId: string, campaignId: string, participationId: string) => {
    if (useMockApi) {
      set({ ratingsLoading: true, ratingsError: null });
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const rows = mockAdminRatings.filter((r) => r.participationId === participationId) as CampaignRating[];
        set((state) => ({
          adminRatings: { ...state.adminRatings, [participationId]: rows },
          ratingsLoading: false,
        }));
      } catch (error: unknown) {
        set({
          ratingsError: error instanceof Error ? error.message : 'Failed to fetch brand ratings',
          ratingsLoading: false,
        });
      }
      return;
    }

    set({ ratingsLoading: true, ratingsError: null });
    try {
      const query = new URLSearchParams({ campaignId, limit: '20' });
      const res = (await api.get(
        `/api/ratings/influencer/${encodeURIComponent(influencerId)}?${query.toString()}`
      )) as { ratings?: unknown[] };
      const list = Array.isArray(res.ratings) ? res.ratings : [];
      const mapped = list.map((item) => mapApiRowToCampaignRating(item as Record<string, unknown>));
      set((state) => ({
        adminRatings: { ...state.adminRatings, [participationId]: mapped },
        ratingsLoading: false,
      }));
    } catch (error: unknown) {
      set({
        ratingsError: error instanceof Error ? error.message : 'Failed to fetch brand ratings',
        ratingsLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
