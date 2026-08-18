import type { InfluencerAnalyticsRow } from './influencer-analytics-map';
import type { CampaignParticipation } from '@/store/campaign-store';

const ACTIVE_STATUSES = new Set(['active', 'completed']);
const PENDING_STATUSES = new Set([
  'invited',
  'accepted',
  'contract_pending',
  'pending',
  'applied',
  'pending_review',
]);

function normStatus(status: string): string {
  return status.trim().toLowerCase().replace(/\s+/g, '_');
}

export function formatReachCount(total: number): string {
  if (!Number.isFinite(total) || total <= 0) return '';
  if (total >= 1_000_000) {
    const m = total / 1_000_000;
    return `${m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (total >= 1_000) {
    const k = total / 1_000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(Math.round(total));
}

/** Followers/subscribers for one connected row — never treat an explicit 0 subscriberCount as the only value. */
export function audienceCount(row: InfluencerAnalyticsRow | null | undefined): number {
  if (!row?.isConnected) return 0;
  return Math.max(0, row.followerCount || row.subscriberCount || 0);
}

export function averageEngagementRate(
  rows: Array<InfluencerAnalyticsRow | null | undefined>
): number {
  const connected = rows.filter((r): r is InfluencerAnalyticsRow => Boolean(r?.isConnected));
  if (connected.length === 0) return 0;
  const sum = connected.reduce((n, r) => n + Number(r.averageEngagementRate || 0), 0);
  return sum / connected.length;
}

export function sumConnectedFollowers(
  instagram: InfluencerAnalyticsRow | null,
  youtube: InfluencerAnalyticsRow | null,
  twitter: InfluencerAnalyticsRow | null
): number {
  return audienceCount(instagram) + audienceCount(youtube) + audienceCount(twitter);
}

export type HomeDashboardStats = {
  /** Formatted reach, or "—" when no connected audience. */
  totalReach: string;
  hasReach: boolean;
  activeCollabs: number;
  pendingApprovals: number;
  /** Share of tracked collabs that are active (0–1). */
  activeRatio: number;
  /** Share of tracked collabs that are pending (0–1). */
  pendingRatio: number;
};

/**
 * Home KPIs from live analytics + participations only — never invents placeholder millions.
 */
export function buildHomeDashboardStats(input: {
  instagramAnalytics: InfluencerAnalyticsRow | null;
  youtubeAnalytics: InfluencerAnalyticsRow | null;
  twitterAnalytics: InfluencerAnalyticsRow | null;
  participations: CampaignParticipation[];
  hasLoadedParticipations: boolean;
  hasLoadedAnalytics: boolean;
}): HomeDashboardStats {
  const reachTotal = sumConnectedFollowers(
    input.instagramAnalytics,
    input.youtubeAnalytics,
    input.twitterAnalytics
  );
  const reachFormatted = formatReachCount(reachTotal);
  const hasReach = reachTotal > 0 && !!reachFormatted;

  const list = input.hasLoadedParticipations ? input.participations : [];
  const activeCount = list.filter((p) => ACTIVE_STATUSES.has(normStatus(p.status))).length;
  const pendingCount = list.filter((p) => PENDING_STATUSES.has(normStatus(p.status))).length;
  const total = list.length;

  return {
    totalReach: hasReach ? reachFormatted : '—',
    hasReach,
    activeCollabs: activeCount,
    pendingApprovals: pendingCount,
    activeRatio: total > 0 ? activeCount / total : 0,
    pendingRatio: total > 0 ? pendingCount / total : 0,
  };
}
