import { create } from 'zustand';
import {
  analyzePost,
  analyzeBulkPosts,
  getPostAnalysisHistory,
  getPostAnalyzerQuota,
  PostAnalyzerDailyLimitError,
  type PostMetrics,
  type PostAnalysis,
  type BulkAnalysisResult,
  type PostAnalyzerQuota,
} from '../lib/post-analyzer-api';

interface PostAnalyzerStore {
  isAnalyzing: boolean;
  currentMetrics: PostMetrics | null;
  currentAnalysisId: string | null;
  currentPersisted: boolean;
  currentPersistError: string | null;
  analyzeError: string | null;
  isBulkAnalyzing: boolean;
  bulkResults: BulkAnalysisResult | null;
  bulkError: string | null;
  dailyLimitError: string | null;
  quota: PostAnalyzerQuota | null;
  quotaLoading: boolean;
  history: PostAnalysis[];
  historyLoading: boolean;
  historyError: string | null;
  historyTotal: number;
  historyPage: number;
  analyzeUrl: (url: string, campaignId?: string) => Promise<PostMetrics | null>;
  analyzeBulkUrls: (urls: string[], campaignId?: string) => Promise<BulkAnalysisResult | null>;
  /** 1 URL → analyze; 2+ → bulk. Clears the unused result channel. */
  analyzeUrls: (
    urls: string[],
    campaignId?: string
  ) => Promise<
    | { mode: 'single'; metrics: PostMetrics | null }
    | { mode: 'bulk'; result: BulkAnalysisResult | null }
  >;
  fetchHistory: (campaignId?: string, page?: number) => Promise<void>;
  fetchQuota: () => Promise<void>;
  clearCurrentMetrics: () => void;
  clearBulkResults: () => void;
}

export const usePostAnalyzerStore = create<PostAnalyzerStore>((set, get) => ({
  isAnalyzing: false,
  currentMetrics: null,
  currentAnalysisId: null,
  currentPersisted: false,
  currentPersistError: null,
  analyzeError: null,
  isBulkAnalyzing: false,
  bulkResults: null,
  bulkError: null,
  dailyLimitError: null,
  quota: null,
  quotaLoading: false,
  history: [],
  historyLoading: false,
  historyError: null,
  historyTotal: 0,
  historyPage: 1,

  analyzeUrl: async (url, campaignId) => {
    set({ isAnalyzing: true, analyzeError: null, dailyLimitError: null, currentMetrics: null });
    try {
      const response = await analyzePost(url, campaignId);
      set({
        currentMetrics: response.data,
        currentAnalysisId: response.analysisId,
        currentPersisted: response.persisted,
        currentPersistError: response.persistError,
        isAnalyzing: false,
      });
      void get().fetchQuota();
      return response.data;
    } catch (err) {
      if (err instanceof PostAnalyzerDailyLimitError) {
        set({
          dailyLimitError: err.message,
          analyzeError: err.message,
          isAnalyzing: false,
          quota: {
            limit: err.limit,
            used: err.used,
            remaining: err.remaining,
            resetsAt: err.resetsAt,
          },
        });
        return null;
      }
      const message = err instanceof Error ? err.message : 'Failed to analyze post';
      set({ analyzeError: message, isAnalyzing: false });
      return null;
    }
  },

  analyzeBulkUrls: async (urls, campaignId) => {
    set({ isBulkAnalyzing: true, bulkError: null, dailyLimitError: null, bulkResults: null });
    try {
      const result = await analyzeBulkPosts(urls, campaignId);
      set({ bulkResults: result, isBulkAnalyzing: false });
      void get().fetchQuota();
      return result;
    } catch (err) {
      if (err instanceof PostAnalyzerDailyLimitError) {
        set({
          dailyLimitError: err.message,
          bulkError: err.message,
          isBulkAnalyzing: false,
          quota: {
            limit: err.limit,
            used: err.used,
            remaining: err.remaining,
            resetsAt: err.resetsAt,
          },
        });
        return null;
      }
      const message = err instanceof Error ? err.message : 'Bulk analysis failed';
      set({ bulkError: message, isBulkAnalyzing: false });
      return null;
    }
  },

  analyzeUrls: async (urls, campaignId) => {
    const cleaned = urls.map((u) => u.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      return { mode: 'single', metrics: null };
    }
    if (cleaned.length === 1) {
      get().clearBulkResults();
      const metrics = await get().analyzeUrl(cleaned[0], campaignId);
      return { mode: 'single', metrics };
    }
    get().clearCurrentMetrics();
    const result = await get().analyzeBulkUrls(cleaned, campaignId);
    return { mode: 'bulk', result };
  },

  fetchHistory: async (campaignId, page = 1) => {
    set({ historyLoading: true, historyError: null });
    try {
      const response = await getPostAnalysisHistory({ campaignId, limit: 20, page });
      set({
        history: page === 1 ? response.data : [...get().history, ...response.data],
        historyTotal: response.total,
        historyPage: page,
        historyLoading: false,
      });
    } catch {
      set({ historyError: 'Failed to load history', historyLoading: false });
    }
  },

  fetchQuota: async () => {
    set({ quotaLoading: true });
    try {
      const quota = await getPostAnalyzerQuota();
      set({ quota, quotaLoading: false });
    } catch {
      set({ quotaLoading: false });
    }
  },

  clearCurrentMetrics: () =>
    set({
      currentMetrics: null,
      currentAnalysisId: null,
      currentPersisted: false,
      currentPersistError: null,
      analyzeError: null,
    }),

  clearBulkResults: () =>
    set({
      bulkResults: null,
      bulkError: null,
    }),
}));
