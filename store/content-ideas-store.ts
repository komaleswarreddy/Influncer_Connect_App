import { create } from 'zustand';
import { contentIdeasApi, type TrendingIdea, type TrendingPlatform } from '@/lib/content-ideas-api';

type State = {
  ideas: TrendingIdea[];
  platform: TrendingPlatform;
  keyword: string;
  isLoading: boolean;
  error: string | null;
  cached: boolean;
  fetchTrending: (opts?: { platform?: TrendingPlatform; keyword?: string }) => Promise<void>;
  setPlatform: (p: TrendingPlatform) => void;
  setKeyword: (k: string) => void;
};

export const useContentIdeasStore = create<State>((set, get) => ({
  ideas: [],
  platform: 'instagram',
  keyword: '',
  isLoading: false,
  error: null,
  cached: false,
  setPlatform: (platform) => set({ platform }),
  setKeyword: (keyword) => set({ keyword }),
  fetchTrending: async (opts) => {
    const platform = opts?.platform ?? get().platform;
    const keyword = opts?.keyword ?? get().keyword;
    set({ isLoading: true, error: null });
    try {
      const res = await contentIdeasApi.trending({ platform, keyword: keyword.trim() || undefined });
      set({ ideas: res.ideas ?? [], cached: Boolean(res.cached), isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : 'Could not load trending ideas',
        isLoading: false,
      });
    }
  },
}));
