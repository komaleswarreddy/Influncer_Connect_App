import type { InfluencerAnalyticsRow } from './influencer-analytics-map';
import type { CampaignParticipation } from '@/store/campaign-store';

export const HOME_STATS_MOCK = {
  ecosystemReach: '12.4M',
  activeCollabs: 12,
  pendingApprovals: 8,
  monthlyGoal: { progress: 53, points: 350 },
} as const;

const ACTIVE_STATUSES = new Set(['active', 'completed']);
const PENDING_STATUSES = new Set(['invited', 'accepted', 'contract_pending']);

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

function sumConnectedFollowers(
  instagram: InfluencerAnalyticsRow | null,
  youtube: InfluencerAnalyticsRow | null,
  twitter: InfluencerAnalyticsRow | null
): number {
  let sum = 0;
  if (instagram?.isConnected) sum += instagram.followerCount;
  if (youtube?.isConnected) {
    sum += youtube.subscriberCount ?? youtube.followerCount;
  }
  if (twitter?.isConnected) sum += twitter.followerCount;
  return sum;
}

export function buildHomeDashboardStats(input: {
  instagramAnalytics: InfluencerAnalyticsRow | null;
  youtubeAnalytics: InfluencerAnalyticsRow | null;
  twitterAnalytics: InfluencerAnalyticsRow | null;
  participations: CampaignParticipation[];
  hasLoadedParticipations: boolean;
  hasLoadedAnalytics: boolean;
}) {
  const reachTotal = sumConnectedFollowers(
    input.instagramAnalytics,
    input.youtubeAnalytics,
    input.twitterAnalytics
  );
  const reachFormatted = formatReachCount(reachTotal);

  const activeCount = input.participations.filter((p) =>
    ACTIVE_STATUSES.has(normStatus(p.status))
  ).length;
  const pendingCount = input.participations.filter((p) =>
    PENDING_STATUSES.has(normStatus(p.status))
  ).length;

  const ecosystemReach =
    !reachFormatted || reachTotal <= 0
      ? HOME_STATS_MOCK.ecosystemReach
      : reachFormatted;

  return {
    ecosystemReach,
    activeCollabs: input.hasLoadedParticipations
      ? activeCount
      : HOME_STATS_MOCK.activeCollabs,
    pendingApprovals: input.hasLoadedParticipations
      ? pendingCount
      : HOME_STATS_MOCK.pendingApprovals,
    monthlyGoal: HOME_STATS_MOCK.monthlyGoal,
  };
}
