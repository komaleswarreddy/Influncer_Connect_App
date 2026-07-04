import type { PostAnalysis } from './post-analyzer-api';

export type MyStatsSummary = {
  totalPosts: number;
  avgER: number;
  totalReach: number;
};

export type RatingSummary = {
  average: number;
  count: number;
};

type ParticipationLike = { id: string };
type RatingsMap = Record<string, { overallRating?: number } | undefined>;

/** Compact number format matching mock (e.g. 19.1M, 536.7K). */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

export function buildMyStatsSummary(history: PostAnalysis[]): MyStatsSummary {
  const totalPosts = history.length;
  const avgER =
    totalPosts > 0
      ? history.reduce((sum, item) => sum + Number(item.engagementRate || 0), 0) / totalPosts
      : 0;
  // Per-post reach: views when available, else creator follower count at analysis time.
  const totalReach = history.reduce(
    (sum, item) => sum + (typeof item.views === 'number' ? item.views : item.creatorFollowers || 0),
    0
  );
  return { totalPosts, avgER, totalReach };
}

export function buildRatingSummary(
  participations: ParticipationLike[],
  ratings: RatingsMap
): RatingSummary {
  const values = participations
    .map((p) => ratings[p.id]?.overallRating)
    .filter((v): v is number => typeof v === 'number' && v > 0);
  const count = values.length;
  const average = count > 0 ? values.reduce((sum, v) => sum + v, 0) / count : 0;
  return { count, average };
}
