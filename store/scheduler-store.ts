import { create } from 'zustand';
import {
  schedulerApi,
  type CaptionSuggestion,
  type CreateScheduledPostPayload,
  type MediaUploadResult,
  type ScheduledPost,
  type SchedulerContentType,
  type UploadFilePart,
} from '@/lib/scheduler-api';

interface SchedulerState {
  posts: ScheduledPost[];
  calendar: Record<string, ScheduledPost[]>;
  captionSuggestions: CaptionSuggestion[];
  lastUpload: MediaUploadResult | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchPosts: (params?: { status?: ScheduledPost['status']; month?: string }) => Promise<void>;
  fetchCalendar: (year: number, month: number) => Promise<void>;
  uploadMedia: (file: UploadFilePart) => Promise<MediaUploadResult>;
  generateCaptions: (topic: string, contentType: SchedulerContentType) => Promise<CaptionSuggestion[]>;
  createPost: (payload: CreateScheduledPostPayload) => Promise<ScheduledPost>;
  updatePost: (postId: string, payload: Partial<CreateScheduledPostPayload>) => Promise<ScheduledPost>;
  cancelPost: (postId: string) => Promise<void>;
  retryDmLink: (postId: string) => Promise<ScheduledPost>;
  clearCaptionSuggestions: () => void;
  clearError: () => void;
}

export const useSchedulerStore = create<SchedulerState>((set) => ({
  posts: [],
  calendar: {},
  captionSuggestions: [],
  lastUpload: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchPosts: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const posts = await schedulerApi.listPosts({ ...params, limit: 50 });
      set({ posts, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load scheduled posts',
        isLoading: false,
      });
    }
  },

  fetchCalendar: async (year, month) => {
    set({ isLoading: true, error: null });
    try {
      const calendar = await schedulerApi.getCalendar(year, month);
      set({ calendar, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load calendar',
        isLoading: false,
      });
    }
  },

  uploadMedia: async (file) => {
    set({ isSaving: true, error: null });
    try {
      const result = await schedulerApi.uploadMedia(file);
      set({ lastUpload: result, isSaving: false });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      set({ error: message, isSaving: false });
      throw new Error(message);
    }
  },

  generateCaptions: async (topic, contentType) => {
    set({ isSaving: true, error: null });
    try {
      const suggestions = await schedulerApi.generateCaption(topic, contentType);
      set({ captionSuggestions: suggestions, isSaving: false });
      return suggestions;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Caption generation failed';
      set({ error: message, isSaving: false });
      throw new Error(message);
    }
  },

  createPost: async (payload) => {
    set({ isSaving: true, error: null });
    try {
      const post = await schedulerApi.createPost(payload);
      set((s) => ({ posts: [post, ...s.posts], isSaving: false }));
      return post;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to schedule post';
      set({ error: message, isSaving: false });
      throw new Error(message);
    }
  },

  updatePost: async (postId, payload) => {
    set({ isSaving: true, error: null });
    try {
      const post = await schedulerApi.updatePost(postId, payload);
      set((s) => ({ posts: s.posts.map((p) => (p.id === postId ? post : p)), isSaving: false }));
      return post;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update post';
      set({ error: message, isSaving: false });
      throw new Error(message);
    }
  },

  retryDmLink: async (postId) => {
    set({ isSaving: true, error: null });
    try {
      const post = await schedulerApi.retryDmLink(postId);
      set((s) => ({
        posts: s.posts.map((p) => (p.id === postId ? post : p)),
        calendar: Object.fromEntries(
          Object.entries(s.calendar).map(([day, posts]) => [
            day,
            posts.map((p) => (p.id === postId ? post : p)),
          ])
        ),
        isSaving: false,
      }));
      return post;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to retry DM link';
      set({ error: message, isSaving: false });
      throw new Error(message);
    }
  },

  cancelPost: async (postId) => {
    set({ isSaving: true, error: null });
    try {
      const post = await schedulerApi.deletePost(postId);
      set((s) => ({ posts: s.posts.map((p) => (p.id === postId ? post : p)), isSaving: false }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel post';
      set({ error: message, isSaving: false });
      throw new Error(message);
    }
  },

  clearCaptionSuggestions: () => set({ captionSuggestions: [] }),
  clearError: () => set({ error: null }),
}));
