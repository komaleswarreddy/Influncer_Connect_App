import { create } from 'zustand';
import { api } from '../lib/api';
import { mockCampaigns, mockParticipations } from '../lib/mock-data';

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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Use mock data instead of API call
      set({ campaigns: mockCampaigns, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch campaigns', isLoading: false });
    }
  },

  fetchCampaign: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find campaign in mock data
      const campaign = mockCampaigns.find(c => c.id === id);
      set({ isLoading: false });
      return campaign || null;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch campaign', isLoading: false });
      return null;
    }
  },

  joinCampaign: async (campaignId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock participation
      const newParticipation: CampaignParticipation = {
        id: `part-${Date.now()}`,
        campaignId,
        influencerId: '1',
        status: 'pending',
        joinedAt: new Date().toISOString(),
        promotionalLinks: [],
        promotionalCodes: [],
        influencer_signature: null
      };
      
      // Add to participations
      set(state => ({
        participations: [...state.participations, newParticipation],
        isLoading: false
      }));
      
      return newParticipation;
    } catch (error: any) {
      set({ error: error.message || 'Failed to join campaign', isLoading: false });
      throw error;
    }
  },

  fetchParticipations: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Use mock data instead of API call
      set({ participations: mockParticipations, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch participations', isLoading: false });
    }
  },

  acceptContract: async (participationId: string, signature: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update participation with signature
      set(state => ({
        participations: state.participations.map(p => 
          p.id === participationId 
            ? { ...p, influencer_signature: signature, status: 'active' }
            : p
        ),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to accept contract', isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
})); 