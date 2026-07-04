import { api } from './api';

export type DmTriggerType = 'comment_keyword' | 'story_reply' | 'dm_keyword';
export type DmMatchType = 'exact' | 'contains' | 'any';
export type DmReplyType = 'text' | 'text_with_link' | 'ai_generated';

export type InstagramMediaKind = 'reel' | 'post' | 'story';

export interface InstagramConnection {
  id: string;
  instagramUserId: string;
  instagramUsername: string;
  instagramName?: string | null;
  profilePictureUrl?: string | null;
  followerCount: number;
  accountType: string;
  isActive: boolean;
  webhookSubscribed: boolean;
  grantedScopes?: string | null;
  hasPublishScope?: boolean;
}

export interface InstagramMediaItem {
  id: string;
  kind: InstagramMediaKind;
  thumbnailUrl: string | null;
  caption: string | null;
  permalink: string | null;
  likeCount: number | null;
  commentCount: number | null;
  timestamp: string | null;
}

export interface AutomationSuggestion {
  suggestedKeywords: string[];
  suggestedReplyMessages: string[];
  suggestedAiContext: string;
  suggestedPublicCommentReply?: string;
}

export interface AutomationStats {
  totalTriggered: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalRepliedBack: number;
  last24hSent: number;
  lastTriggeredAt?: string | null;
}

export interface DmAutomationLog {
  id: string;
  automationId: string;
  triggerType: DmTriggerType;
  triggerUserId: string;
  triggerUsername?: string | null;
  triggerText?: string | null;
  messagesSent: string;
  deliveryStatus: string;
  errorMessage?: string | null;
  repliedBack: boolean;
  createdAt: string;
}

export interface DmAutomation {
  id: string;
  name: string;
  triggerType: DmTriggerType;
  triggerKeywords: string[];
  matchType: DmMatchType;
  replyType: DmReplyType;
  replyMessages: string[];
  replyLink?: string | null;
  replyLinkLabel?: string | null;
  publicCommentReply?: string | null;
  publicCommentVariants?: string[];
  aiContext?: string | null;
  isActive: boolean;
  postFilter?: string;
  specificPostId?: string | null;
  totalSent: number;
  totalReplied: number;
  lastTriggeredAt?: string | null;
  createdAt: string;
  stats?: AutomationStats;
  recentLogs?: DmAutomationLog[];
  linkedMedia?: InstagramMediaItem | null;
}

export interface SummaryStats {
  totalSentLast7Days: number;
  totalDeliveredLast7Days: number;
  todaySent: number;
  topPerformingAutomation: { id: string; name: string; totalTriggered: number } | null;
}

export interface CreateAutomationPayload {
  name: string;
  triggerType: DmTriggerType;
  triggerKeywords: string[];
  matchType: DmMatchType;
  replyType: DmReplyType;
  replyMessages: string[];
  replyLink?: string;
  replyLinkLabel?: string;
  publicCommentReply?: string;
  publicCommentVariants?: string[];
  aiContext?: string;
  postFilter: 'specific_post';
  specificPostId: string;
  replaceExisting?: boolean;
}

export const instagramAutomationApi = {
  getConnectUrl: async (): Promise<{ authUrl: string }> =>
    (await api.get('/api/instagram-auth/connect-url')) as { authUrl: string },

  getConnectionStatus: async (): Promise<{
    connected: boolean;
    hasPublishScope?: boolean;
    connection?: InstagramConnection;
  }> =>
    (await api.get('/api/instagram-auth/status')) as {
      connected: boolean;
      connection?: InstagramConnection;
    },

  disconnect: async (): Promise<{ success: boolean }> =>
    (await api.delete('/api/instagram-auth/disconnect')) as { success: boolean },

  getAutomations: async (): Promise<{ automations: DmAutomation[] }> =>
    (await api.get('/api/dm-automations')) as { automations: DmAutomation[] },

  createAutomation: async (data: CreateAutomationPayload): Promise<{ automation: DmAutomation }> =>
    (await api.post('/api/dm-automations', data)) as { automation: DmAutomation },

  updateAutomation: async (
    id: string,
    data: CreateAutomationPayload
  ): Promise<{ automation: DmAutomation }> =>
    (await api.put(`/api/dm-automations/${id}`, data)) as { automation: DmAutomation },

  toggleAutomation: async (id: string): Promise<{ automation: DmAutomation }> =>
    (await api.patch(`/api/dm-automations/${id}/toggle`, {})) as { automation: DmAutomation },

  deleteAutomation: async (id: string): Promise<{ success: boolean }> =>
    (await api.delete(`/api/dm-automations/${id}`)) as { success: boolean },

  getAutomationLogs: async (
    id: string,
    page = 1
  ): Promise<{ logs: DmAutomationLog[]; page: number; limit: number; total: number }> =>
    (await api.get(`/api/dm-automations/${id}/logs?page=${page}`)) as {
      logs: DmAutomationLog[];
      page: number;
      limit: number;
      total: number;
    },

  getSummaryStats: async (): Promise<SummaryStats> =>
    (await api.get('/api/dm-automations/stats/summary')) as SummaryStats,

  previewAi: async (aiContext: string, sampleMessage: string): Promise<{ preview: string | null }> => {
    const qs = new URLSearchParams({ aiContext, sampleMessage }).toString();
    return (await api.get(`/api/dm-automations/preview-ai?${qs}`)) as { preview: string | null };
  },

  listMedia: async (
    kind: 'reels' | 'posts' | 'stories',
    options?: { refresh?: boolean; after?: string }
  ): Promise<{ kind: string; items: InstagramMediaItem[]; nextCursor: string | null }> => {
    const qs = new URLSearchParams({ kind, limit: '24' });
    if (options?.after) qs.set('after', options.after);
    if (options?.refresh) qs.set('refresh', 'true');
    return (await api.get(`/api/instagram-media?${qs.toString()}`)) as {
      kind: string;
      items: InstagramMediaItem[];
      nextCursor: string | null;
    };
  },

  getMediaById: async (mediaId: string): Promise<{ media: InstagramMediaItem }> =>
    (await api.get(`/api/instagram-media/${mediaId}`)) as { media: InstagramMediaItem },

  suggestAutomation: async (data: {
    mediaId: string;
    triggerType: DmTriggerType;
    replyType?: DmReplyType;
  }): Promise<{ suggestion: AutomationSuggestion; media: InstagramMediaItem }> =>
    (await api.post('/api/dm-automations/suggest', data)) as {
      suggestion: AutomationSuggestion;
      media: InstagramMediaItem;
    },
};
