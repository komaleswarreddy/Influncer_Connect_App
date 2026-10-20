import { PROFILE_NICHES, SOCIAL_PLATFORMS } from '@/constants/influencer-profile';

/** The slice of the profile response the completion card reads. */
export type ProfileForCompletion = {
  username?: string | null;
  niche?: string | null;
  subNiches?: string[] | null;
  bio?: string | null;
  socialMedia?: Record<string, string | undefined> | null;
  user?: { phone?: string | null } | null;
};

export type ProfileStep = { key: string; label: string; done: boolean };

export type ProfileCompletion = {
  percent: number;
  steps: ProfileStep[];
  /** First step still missing, or null at 100%. */
  next: ProfileStep | null;
};

export function computeProfileCompletion(
  p: ProfileForCompletion | null | undefined
): ProfileCompletion {
  const filled = (v?: string | null) => Boolean(v && v.trim());
  const steps: ProfileStep[] = [
    { key: 'username', label: 'Add your username', done: filled(p?.username) },
    { key: 'phone', label: 'Add your phone number', done: filled(p?.user?.phone) },
    { key: 'bio', label: 'Write a short bio', done: filled(p?.bio) },
    {
      key: 'category',
      label: 'Pick your category',
      done: PROFILE_NICHES.includes((p?.niche || '').trim()),
    },
    { key: 'subNiches', label: 'Choose your sub-niches', done: (p?.subNiches?.length ?? 0) > 0 },
    {
      key: 'social',
      label: 'Link a social account',
      done: SOCIAL_PLATFORMS.some((s) => filled(p?.socialMedia?.[s.key])),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  return {
    percent: Math.round((doneCount / steps.length) * 100),
    steps,
    next: steps.find((s) => !s.done) ?? null,
  };
}
