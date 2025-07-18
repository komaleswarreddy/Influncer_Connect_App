import { create } from 'zustand';
import { api } from '../lib/api';

interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: string;
  type: string;
  targetAudienceAgeGroup: string;
  requiredInfluencerNiche: string;
  basicGuidelines: string;
  preferredSocialMedia: string;
  contentRequirements: Array<{
    type: string;
    count: number;
    schedule?: string;
    description?: string;
  }>;
  commissionRate?: number;
  metrics: {
    totalReach: number;
    engagementRate: number;
    conversions: number;
    revenue: number;
  };
  targets?: {
    totalReach: number;
    engagementRate: number;
    conversions: number;
    revenue: number;
  };
  tenantId: string;
  tenant?: {
    id: string;
    tenantName: string;
    domain: string;
    subdomain: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CampaignParticipation {
  id: string;
  campaignId: string;
  influencerId: string;
  status: string;
  joinedAt: string;
  completedAt?: string;
  promotionalLinks: string[];
  promotionalCodes: string[];
  influencer_signature?: string;
}

interface CampaignState {
  campaigns: Campaign[];
  participations: CampaignParticipation[];
  isLoading: boolean;
  error: string | null;
  fetchCampaigns: () => Promise<void>;
  fetchCampaign: (id: string) => Promise<Campaign | null>;
  joinCampaign: (campaignId: string) => Promise<CampaignParticipation>;
  fetchParticipations: () => Promise<void>;
  acceptContract: (participationId: string, signature: string) => Promise<void>;
  clearError: () => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  participations: [],
  isLoading: false,
  error: null,

  fetchCampaigns: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/campaigns');
      set({ campaigns: response as Campaign[], isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch campaigns', isLoading: false });
    }
  },

  fetchCampaign: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/api/campaigns/${id}`);
      set({ isLoading: false });
      return response as Campaign;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch campaign', isLoading: false });
      return null;
    }
  },

  joinCampaign: async (campaignId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/api/campaigns/${campaignId}/join`, {});
      set({ isLoading: false });
      return response as CampaignParticipation;
    } catch (error: any) {
      set({ error: error.message || 'Failed to join campaign', isLoading: false });
      throw error;
    }
  },

  fetchParticipations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/campaigns/participations');
      set({ participations: response as CampaignParticipation[], isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch participations', isLoading: false });
    }
  },

  acceptContract: async (participationId: string, signature: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/api/campaigns/${participationId}/accept-contract`, { signature });
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to accept contract', isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
})); 