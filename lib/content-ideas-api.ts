import { api } from './api';

export type TrendingPlatform = 'instagram' | 'tiktok' | 'youtube';

export type TrendingIdea = {
  title: string;
  hook: string;
  hashtags: string;
  bestTime: string;
  rationale: string;
  contentType: string;
};

export type TrendingIdeasResponse = {
  success: boolean;
  ideas: TrendingIdea[];
  cached: boolean;
  generatedAt: string;
};

export const contentIdeasApi = {
  trending: (params: { platform?: TrendingPlatform; keyword?: string; range?: '7d' | '30d' }) => {
    const q = new URLSearchParams();
    if (params.platform) q.set('platform', params.platform);
    if (params.keyword) q.set('keyword', params.keyword);
    if (params.range) q.set('range', params.range);
    const qs = q.toString();
    return api.get(`/api/content-ideas/trending${qs ? `?${qs}` : ''}`) as Promise<TrendingIdeasResponse>;
  },
};
