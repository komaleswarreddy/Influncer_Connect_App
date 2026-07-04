import { api } from './api';

export type SchedulerContentType = 'reel' | 'post' | 'story';
export type SchedulerMediaType = 'image' | 'video';
export type ScheduledPostStatus = 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
export type DmLinkStatus = 'pending' | 'linked' | 'failed';
export type DmMatchType = 'exact' | 'contains' | 'any';
export type DmReplyType = 'text' | 'text_with_link' | 'ai_generated';

export interface DmAutomationDraft {
  name: string;
  triggerKeywords: string[];
  matchType: DmMatchType;
  replyType: DmReplyType;
  replyMessages: string[];
  replyLink?: string;
  replyLinkLabel?: string;
  publicCommentReply?: string;
  aiContext?: string;
}

export interface ScheduledPost {
  id: string;
  contentType: SchedulerContentType;
  mediaUrl: string;
  mediaType: SchedulerMediaType;
  thumbnailUrl: string | null;
  caption: string | null;
  hashtags: string | null;
  scheduledAt: string;
  timezone: string;
  status: ScheduledPostStatus;
  instagramPostId: string | null;
  instagramPermalink: string | null;
  errorMessage: string | null;
  retryCount: number;
  publishedAt: string | null;
  dmAutomationId: string | null;
  dmAutomationName: string | null;
  dmLinkStatus: DmLinkStatus | null;
  dmLinkError: string | null;
  dmAutomation: DmAutomationDraft | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaptionSuggestion {
  caption: string;
  hashtags: string;
}

export interface MediaUploadResult {
  uploadId: string;
  mediaUrl: string;
  mediaType: SchedulerMediaType;
  thumbnailUrl: string;
  publicId: string;
  fileSizeBytes: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
}

export interface CreateScheduledPostPayload {
  contentType: SchedulerContentType;
  mediaUrl: string;
  mediaType: SchedulerMediaType;
  thumbnailUrl?: string;
  caption?: string;
  hashtags?: string;
  scheduledAt: string;
  timezone?: string;
  dmAutomation?: DmAutomationDraft;
  removeDmAutomation?: boolean;
}

export interface UploadFilePart {
  uri: string;
  name: string;
  type: string;
}

export const schedulerApi = {
  uploadMedia: async (file: UploadFilePart): Promise<MediaUploadResult> => {
    const form = new FormData();
    form.append('file', file as unknown as Blob);
    return (await api.post('/api/scheduled-posts/upload-media', form)) as MediaUploadResult;
  },

  generateCaption: async (topic: string, contentType: SchedulerContentType): Promise<CaptionSuggestion[]> => {
    const res = (await api.post('/api/scheduled-posts/generate-caption', { topic, contentType })) as {
      suggestions: CaptionSuggestion[];
    };
    return res.suggestions;
  },

  createPost: async (payload: CreateScheduledPostPayload): Promise<ScheduledPost> => {
    const res = (await api.post('/api/scheduled-posts', payload)) as { post: ScheduledPost };
    return res.post;
  },

  listPosts: async (params?: {
    status?: ScheduledPostStatus;
    month?: string;
    limit?: number;
  }): Promise<ScheduledPost[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.month) query.set('month', params.month);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    const res = (await api.get(`/api/scheduled-posts${qs ? `?${qs}` : ''}`)) as { posts: ScheduledPost[] };
    return res.posts;
  },

  getPost: async (postId: string): Promise<ScheduledPost> => {
    const res = (await api.get(`/api/scheduled-posts/${postId}`)) as { post: ScheduledPost };
    return res.post;
  },

  updatePost: async (
    postId: string,
    payload: Partial<CreateScheduledPostPayload>
  ): Promise<ScheduledPost> => {
    const res = (await api.put(`/api/scheduled-posts/${postId}`, payload)) as { post: ScheduledPost };
    return res.post;
  },

  deletePost: async (postId: string): Promise<ScheduledPost> => {
    const res = (await api.delete(`/api/scheduled-posts/${postId}`)) as { post: ScheduledPost };
    return res.post;
  },

  retryDmLink: async (postId: string): Promise<ScheduledPost> => {
    const res = (await api.post(`/api/scheduled-posts/${postId}/retry-dm-link`, {})) as { post: ScheduledPost };
    return res.post;
  },

  getCalendar: async (year: number, month: number): Promise<Record<string, ScheduledPost[]>> => {
    const res = (await api.get(`/api/scheduled-posts/calendar/${year}/${month}`)) as {
      calendar: Record<string, ScheduledPost[]>;
    };
    return res.calendar;
  },
};
