import { create } from 'zustand';
import { api } from '../lib/api';

export interface Campaign {
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
  contentRequirements: {
    type: string;
    count: number;
    schedule?: string;
    description?: string;
  }[];
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

/** Nested campaign from GET /api/campaigns/participations (includes optional tenant for brand label). */
export interface ParticipationCampaignEmbed {
  id: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  type?: string | null;
  commissionRate?: number | null;
  tenant?: {
    id?: string | null;
    tenantName?: string | null;
  };
}

export interface CampaignParticipation {
  id: string;
  campaignId: string;
  influencerId: string;
  /** Set when participation came from accepting a brand invite — contract allowed without application approval. */
  inviteId?: string | null;
  status: string;
  joinedAt: string;
  completedAt?: string | null;
  promotionalLinks: string[];
  promotionalCodes: string[];
  influencer_signature?: string | null;
  campaign?: ParticipationCampaignEmbed | null;
}

interface CampaignInvite {
  id: string;
  campaignId: string;
  influencerUserId: string;
  status: 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  expiresAt: string;
  sentAt: string;
  respondedAt?: string | null;
  declineReason?: string | null;
  campaign?: Campaign;
}

interface CampaignApplication {
  id: string;
  campaignId: string;
  influencerUserId: string;
  status: string;
  appliedAt: string;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  campaign?: Campaign;
}

interface CampaignApplicationForBrand extends CampaignApplication {
  influencer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  campaignId?: string | null;
  inviteId?: string | null;
  metadata?: { bookingId?: string } | null;
}

interface CampaignState {
  campaigns: Campaign[];
  participations: CampaignParticipation[];
  invites: CampaignInvite[];
  applications: CampaignApplication[];
  notifications: AppNotification[];
  unreadNotifications: number;
  isLoading: boolean;
  error: string | null;
  fetchCampaigns: () => Promise<void>;
  fetchCampaign: (id: string) => Promise<Campaign | null>;
  fetchParticipations: () => Promise<void>;
  fetchInvites: () => Promise<void>;
  fetchMyApplications: () => Promise<void>;
  applyToCampaign: (campaignId: string) => Promise<{
    applicationId: string | null;
    status: string;
    participationId: string | null;
  }>;
  fetchCampaignApplicationsForBrand: (campaignId: string) => Promise<CampaignApplicationForBrand[]>;
  approveApplication: (applicationId: string, note?: string) => Promise<void>;
  rejectApplication: (applicationId: string, note?: string) => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<string | null>;
  declineInvite: (inviteId: string, reason?: string) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markInviteViewed: (inviteId: string) => Promise<void>;
  acceptContract: (participationId: string, signature: string) => Promise<void>;
  clearError: () => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  participations: [],
  invites: [],
  applications: [],
  notifications: [],
  unreadNotifications: 0,
  isLoading: false,
  error: null,

  fetchCampaigns: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = (await api.get('/api/campaigns')) as Campaign[];
      set({ campaigns: Array.isArray(data) ? data : [], isLoading: false });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch campaigns';
      set({ error: msg, isLoading: false });
    }
  },

  fetchCampaign: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const campaign = (await api.get(`/api/campaigns/${id}`)) as Campaign;
      set({ isLoading: false });
      return campaign || null;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch campaign';
      set({ error: msg, isLoading: false });
      return null;
    }
  },

  fetchParticipations: async () => {
    set({ isLoading: true, error: null });
    try {
      const raw = await api.get('/api/campaigns/participations');
      const data = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray((raw as { participations?: CampaignParticipation[] }).participations)
          ? (raw as { participations: CampaignParticipation[] }).participations
          : [];
      set({
        participations: data,
        isLoading: false,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch participations';
      set({ error: msg, isLoading: false });
    }
  },

  fetchInvites: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = (await api.get('/api/campaign-invites/my')) as {
        success: boolean;
        invites: CampaignInvite[];
      };
      set({ invites: data.invites ?? [], isLoading: false });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch invites';
      set({ error: msg, isLoading: false });
    }
  },

  fetchMyApplications: async () => {
    set({ isLoading: true, error: null });
    try {
      const raw = (await api.get('/api/campaign-applications/my')) as
        | { success?: boolean; applications?: CampaignApplication[] }
        | CampaignApplication[];
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.applications)
          ? raw.applications
          : [];
      set({ applications: list, isLoading: false });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch applications';
      set({ error: msg, isLoading: false });
    }
  },

  applyToCampaign: async (campaignId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = (await api.post(`/api/campaigns/${campaignId}/apply`, {})) as {
        success?: boolean;
        applicationId?: string | null;
        applicationStatus?: string | null;
        participationId?: string | null;
      };
      await get().fetchMyApplications();
      await get().fetchParticipations();
      set({ isLoading: false });
      return {
        applicationId: data.applicationId ?? null,
        status: String(data.applicationStatus ?? 'applied'),
        participationId: data.participationId ?? null,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to apply to campaign';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  fetchCampaignApplicationsForBrand: async (campaignId: string) => {
    set({ isLoading: true, error: null });
    try {
      const raw = (await api.get(`/api/campaign-applications/campaign/${campaignId}`)) as
        | { success?: boolean; applications?: CampaignApplicationForBrand[] }
        | CampaignApplicationForBrand[];
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.applications)
          ? raw.applications
          : [];
      set({ isLoading: false });
      return list;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch campaign applications';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  approveApplication: async (applicationId: string, note?: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/api/campaign-applications/${applicationId}/approve`, note ? { note } : {});
      set({ isLoading: false });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to approve application';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  rejectApplication: async (applicationId: string, note?: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/api/campaign-applications/${applicationId}/reject`, note ? { note } : {});
      set({ isLoading: false });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to reject application';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  acceptInvite: async (inviteId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = (await api.post(`/api/campaign-invites/invite/${inviteId}/accept`, {})) as {
        success: boolean;
        participationId?: string;
      };
      await get().fetchInvites();
      await get().fetchParticipations();
      set({ isLoading: false });
      return data.participationId ?? null;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to accept invite';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  declineInvite: async (inviteId: string, reason?: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/api/campaign-invites/invite/${inviteId}/decline`, { reason });
      await get().fetchInvites();
      set({ isLoading: false });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to decline invite';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  fetchNotifications: async () => {
    try {
      const data = (await api.get('/api/campaign-invites/notifications/my')) as {
        success: boolean;
        unread: number;
        notifications: AppNotification[];
      };
      set({
        notifications: data.notifications ?? [],
        unreadNotifications: Number(data.unread ?? 0),
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch notifications';
      set({ error: msg });
    }
  },

  markNotificationRead: async (notificationId: string) => {
    try {
      await api.post(`/api/campaign-invites/notifications/${notificationId}/read`, {});
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadNotifications: Math.max(
          0,
          state.notifications.filter((n) => !n.isRead && n.id !== notificationId).length
        ),
      }));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to mark notification as read';
      set({ error: msg });
    }
  },
  markInviteViewed: async (inviteId: string) => {
    try {
      await api.post(`/api/campaign-invites/invite/${inviteId}/view`);
    } catch {
      /* non-blocking */
    }
  },


  acceptContract: async (participationId: string, signature: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/api/campaigns/${participationId}/accept-contract`, { signature });
      await get().fetchParticipations();
      set({ isLoading: false });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to accept contract';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
})); 