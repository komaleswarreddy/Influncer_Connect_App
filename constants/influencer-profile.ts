import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

/** Profile niche picker: a category (stored in `niche`) and up to MAX_SUB_NICHES sub-niches under it. */
export const PROFILE_CATEGORIES = [
  { name: 'Fashion', subs: ['Streetwear', 'Luxury', 'Sustainable', 'Ethnic wear', 'Accessories'] },
  { name: 'Beauty', subs: ['Skincare', 'Makeup', 'Hair care', 'Grooming', 'Nail art'] },
  {
    name: 'Lifestyle',
    subs: ['Daily vlogs', 'Home & decor', 'Minimalism', 'Productivity', 'Pets'],
  },
  {
    name: 'Food',
    subs: ['Home cooking', 'Street food', 'Baking', 'Restaurant reviews', 'Healthy eating'],
  },
  {
    name: 'Travel',
    subs: ['Budget travel', 'Luxury travel', 'Adventure', 'Road trips', 'Culture & heritage'],
  },
  {
    name: 'Fitness & Health',
    subs: ['Gym workouts', 'Yoga', 'Nutrition', 'Running', 'Mental wellness'],
  },
  {
    name: 'Tech & Gadgets',
    subs: ['Smartphones', 'Reviews & unboxing', 'Software & apps', 'PC & hardware', 'AI tools'],
  },
  {
    name: 'Gaming',
    subs: ['Mobile gaming', 'PC gaming', 'Console gaming', 'Esports', 'Game reviews'],
  },
  {
    name: 'Education',
    subs: ['Study tips', 'Career guidance', 'Languages', 'Science & maths', 'Skill building'],
  },
  {
    name: 'Finance & Business',
    subs: ['Investing', 'Personal finance', 'Entrepreneurship', 'Side hustles', 'Marketing'],
  },
  {
    name: 'Entertainment & Comedy',
    subs: ['Comedy skits', 'Movies & TV', 'Music', 'Dance', 'Memes & reactions'],
  },
  {
    name: 'Parenting & Family',
    subs: ['Newborn & baby', 'Kids activities', 'Family travel', 'Pregnancy', 'Teen parenting'],
  },
] as const;

export const PROFILE_NICHES: readonly string[] = PROFILE_CATEGORIES.map((c) => c.name);
export const MAX_SUB_NICHES = 3;
export const OTHER_SUB_NICHE_MAX_LENGTH = 30;

export function subNichesFor(category: string): readonly string[] {
  return PROFILE_CATEGORIES.find((c) => c.name === category)?.subs ?? [];
}

export type SocialPlatformKey = 'instagram' | 'youtube' | 'twitter' | 'reddit' | 'linkedin';

export type SocialPlatform = {
  key: SocialPlatformKey;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  /** Fixed part of the link; the creator types only what comes after it. */
  prefix: string;
  placeholder: string;
};

export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    icon: 'logo-instagram',
    prefix: 'https://instagram.com/',
    placeholder: 'yourusername',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: 'logo-youtube',
    prefix: 'https://youtube.com/@',
    placeholder: 'yourchannel',
  },
  {
    key: 'twitter',
    label: 'X (Twitter)',
    icon: 'logo-twitter',
    prefix: 'https://x.com/',
    placeholder: 'yourhandle',
  },
  {
    key: 'reddit',
    label: 'Reddit',
    icon: 'logo-reddit',
    prefix: 'https://reddit.com/user/',
    placeholder: 'yourusername',
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: 'logo-linkedin',
    prefix: 'https://linkedin.com/in/',
    placeholder: 'yourname',
  },
];

const HANDLE_PATTERN = /^[A-Za-z0-9._-]{1,60}$/;

/** What the person typed or pasted -> just the handle (accepts a full link, an @name, or a bare name). */
export function toSocialHandle(raw: string): string {
  let v = raw.trim();
  v = v.replace(/^https?:\/\/(www\.|m\.|old\.)?[^/]+\//i, '');
  v = v.replace(/^(user|u|in|c|channel)\//i, '');
  v = v.replace(/^@+/, '');
  v = v.split(/[/?#]/)[0] ?? '';
  return v.trim();
}

export function isValidSocialHandle(handle: string): boolean {
  return HANDLE_PATTERN.test(handle);
}

/** Handle -> the full link the server stores; empty when there is no handle. */
export function buildSocialUrl(platform: SocialPlatform, handle: string): string {
  const h = toSocialHandle(handle);
  return h ? `${platform.prefix}${h}` : '';
}
