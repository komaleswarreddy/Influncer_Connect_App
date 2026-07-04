import { create } from 'zustand';
import {
  analyzePost,
  analyzeBulkPosts,
  getPostAnalysisHistory,
  type PostMetrics,
  type PostAnalysis,
  type BulkAnalysisResult,
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
  history: PostAnalysis[];
  historyLoading: boolean;
  historyError: string | null;
  historyTotal: number;
  historyPage: number;
  analyzeUrl: (url: string, campaignId?: string) => Promise<PostMetrics | null>;
  analyzeBulkUrls: (urls: string[], campaignId?: string) => Promise<BulkAnalysisResult | null>;
  fetchHistory: (campaignId?: string, page?: number) => Promise<void>;
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
  history: [],
  historyLoading: false,
  historyError: null,
  historyTotal: 0,
  historyPage: 1,

  analyzeUrl: async (url, campaignId) => {
    set({ isAnalyzing: true, analyzeError: null, currentMetrics: null });
    try {
      const response = await analyzePost(url, campaignId);
      set({
        currentMetrics: response.data,
        currentAnalysisId: response.analysisId,
        currentPersisted: response.persisted,
        currentPersistError: response.persistError,
        isAnalyzing: false,
      });
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze post';
      set({ analyzeError: message, isAnalyzing: false });
      return null;
    }
  },

  analyzeBulkUrls: async (urls, campaignId) => {
    set({ isBulkAnalyzing: true, bulkError: null, bulkResults: null });
    try {
      const result = await analyzeBulkPosts(urls, campaignId);
      set({ bulkResults: result, isBulkAnalyzing: false });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bulk analysis failed';
      set({ bulkError: message, isBulkAnalyzing: false });
      return null;
    }
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
