import { api } from './api';

export type KitTemplate = 'classic' | 'bold' | 'minimal' | 'dark';
export const KIT_TEMPLATES: { key: KitTemplate; label: string; blurb: string }[] = [
  { key: 'classic', label: 'Classic', blurb: 'Clean and friendly' },
  { key: 'bold', label: 'Bold', blurb: 'Gradient header, big presence' },
  { key: 'minimal', label: 'Minimal', blurb: 'Editorial black and white' },
  { key: 'dark', label: 'Dark', blurb: 'Night mode with a lime accent' },
];

export interface KitLink {
  label: string;
  url: string;
}

export interface MediaKit {
  id: string;
  slug: string;
  url: string;
  template: KitTemplate;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  contactEmail: string | null;
  featuredLinks: KitLink[];
  showStats: boolean;
  showRates: boolean;
  showScore: boolean;
  showContact: boolean;
  acceptEnquiries: boolean;
  isPublished: boolean;
  viewCount: number;
  lastViewedAt: string | null;
}

export interface ViralComponent {
  key: string;
  label: string;
  value: number;
  weight: number;
  detail: string;
}

export interface KitSnapshot {
  identity: {
    name: string;
    niche: string;
    country: string;
    instagramHandle: string | null;
    avatarUrl: string | null;
  };
  stats: { followers: number | null; engagementRate: number | null; avgViews: number | null };
  viral: {
    score: number | null;
    label: string | null;
    components: ViralComponent[];
    missing: string[];
  };
  rates: {
    items: { key: string; label: string; amount: number }[];
    range: { min: number; max: number; currency: string; basis: 'rate_card' | 'estimated' } | null;
    currency: string;
  };
}

export interface MediaKitOverview {
  exists: boolean;
  kit: MediaKit | null;
  snapshot: KitSnapshot;
  suggestedSlug: string | null;
  maxLinks: number;
}

export type MediaKitUpdate = Partial<
  Pick<
    MediaKit,
    | 'template'
    | 'displayName'
    | 'headline'
    | 'bio'
    | 'contactEmail'
    | 'featuredLinks'
    | 'showStats'
    | 'showRates'
    | 'showScore'
    | 'showContact'
    | 'acceptEnquiries'
    | 'isPublished'
    | 'slug'
  >
>;

export const mediaKitApi = {
  me: () => api.get('/api/media-kit/me') as Promise<MediaKitOverview>,
  save: (body: MediaKitUpdate) => api.put('/api/media-kit/me', body) as Promise<{ kit: MediaKit }>,
  qr: () => api.get('/api/media-kit/me/qr') as Promise<{ url: string; svg: string }>,
  suggestCopy: () =>
    api.post('/api/media-kit/me/suggest-copy', {}) as Promise<{
      headline: string;
      bio: string;
      source: 'llm' | 'template';
    }>,
  slugAvailable: (slug: string) =>
    api.get(`/api/media-kit/slug-available?slug=${encodeURIComponent(slug)}`) as Promise<{
      slug: string;
      available: boolean;
      reason: string | null;
    }>,
};
