import { create } from 'zustand';
import { contentProgressApi } from '../lib/api';

interface ContentProgress {
  id: string;
  participationId: string;
  contentType: string;
  requiredCount: number;
  completedCount: number;
  schedule: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  submissions: ContentSubmission[];
}

interface ContentSubmission {
  id: string;
  progressId: string;
  participationId: string;
  contentType: string;
  contentUrl: string;
  submissionDate: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  analysisId?: string | null;
  analysis?: any;
  createdAt: string;
  updatedAt: string;
}

interface ProgressSummary {
  totalRequired: number;
  totalCompleted: number;
  percentage: number;
}

interface ProgressData {
  progress: ContentProgress[];
  summary: ProgressSummary;
}

interface ProgressState {
  progressData: Record<string, ProgressData>;
  isLoading: boolean;
  error: string | null;
  fetchProgress: (participationId: string) => Promise<void>;
  submitContent: (participationId: string, data: { progressId: string; contentUrl: string; contentType: string; analysisId?: string | null }) => Promise<void>;
  updateSubmission: (submissionId: string, data: { contentUrl: string }) => Promise<void>;
  deleteSubmission: (submissionId: string) => Promise<void>;
  clearError: () => void;
  clearProgress: (participationId: string) => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  progressData: {},
  isLoading: false,
  error: null,

  fetchProgress: async (participationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await contentProgressApi.getProgress(participationId);
      set((state) => ({
        progressData: {
          ...state.progressData,
          [participationId]: response as ProgressData
        },
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch progress', isLoading: false });
    }
  },

  submitContent: async (participationId: string, data: { progressId: string; contentUrl: string; contentType: string; analysisId?: string | null }) => {
    set({ isLoading: true, error: null });
    try {
      await contentProgressApi.submitContent(participationId, data);
      // Refresh progress data after submission
      await get().fetchProgress(participationId);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to submit content', isLoading: false });
      throw error;
    }
  },

  updateSubmission: async (submissionId: string, data: { contentUrl: string }) => {
    set({ isLoading: true, error: null });
    try {
      await contentProgressApi.updateSubmission(submissionId, data);
      // Refresh all progress data to update the UI
      const currentProgressData = get().progressData;
      const participationIds = Object.keys(currentProgressData);
      await Promise.all(participationIds.map(id => get().fetchProgress(id)));
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update submission', isLoading: false });
      throw error;
    }
  },

  deleteSubmission: async (submissionId: string) => {
    set({ isLoading: true, error: null });
    try {
      await contentProgressApi.deleteSubmission(submissionId);
      // Refresh all progress data to update the UI
      const currentProgressData = get().progressData;
      const participationIds = Object.keys(currentProgressData);
      await Promise.all(participationIds.map(id => get().fetchProgress(id)));
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete submission', isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  clearProgress: (participationId: string) => {
    set((state) => {
      const newProgressData = { ...state.progressData };
      delete newProgressData[participationId];
      return { progressData: newProgressData };
    });
  },
})); 