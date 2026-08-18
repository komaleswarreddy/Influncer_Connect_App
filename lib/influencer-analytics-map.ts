export type InfluencerAnalyticsRow = {
  id: string;
  influencerId: string;
  username: string;
  profilePictureUrl: string;
  followerCount: number;
  /** YouTube subscriber count when present */
  subscriberCount?: number;
  averageEngagementRate: number;
  malePercentage: number;
  femalePercentage: number;
  audienceDemographicsAgeRange: string;
  topAudienceLocation: string;
  isConnected: boolean;
  createdAt: string;
  updatedAt: string;
  /** YouTube: last Phyllo sync diagnostics from the API (subscriber keys, sample reputation fields, notes). */
  phylloSyncMeta?: Record<string, unknown> | null;
  /** When set from Phyllo `preview.mapped.demographicsSource` — hide 50/50 gender placeholder when `unknown`. */
  demographicsSource?: 'phyllo' | 'unknown';
};

function demographicsSourceFromMeta(meta: unknown): 'phyllo' | 'unknown' | undefined {
  if (!meta || typeof meta !== 'object') return undefined;
  const p = (meta as { preview?: { mapped?: { demographicsSource?: string } } }).preview?.mapped
    ?.demographicsSource;
  if (p === 'phyllo' || p === 'unknown') return p;
  return undefined;
}

export function mapAnalyticsRow(
  row: Record<string, unknown> | null | undefined
): InfluencerAnalyticsRow | null {
  if (!row) return null;
  const sub = row.subscriberCount != null ? Number(row.subscriberCount) : undefined;
  const fol = Number(row.followerCount ?? sub ?? 0);
  const connectedRaw = row.isConnected ?? (row as { is_connected?: unknown }).is_connected;
  const meta = row.phylloSyncMeta;
  const demoSrc = demographicsSourceFromMeta(meta);
  return {
    id: String(row.id ?? ''),
    influencerId: String(row.influencerId ?? ''),
    username: String(row.username ?? ''),
    profilePictureUrl: String(row.profilePictureUrl ?? ''),
    followerCount: fol,
    ...(sub != null && !Number.isNaN(sub) ? { subscriberCount: sub } : {}),
    averageEngagementRate: Number(row.averageEngagementRate ?? 0),
    malePercentage: Number(row.malePercentage ?? 0),
    femalePercentage: Number(row.femalePercentage ?? 0),
    audienceDemographicsAgeRange: String(row.audienceDemographicsAgeRange ?? ''),
    topAudienceLocation: String(row.topAudienceLocation ?? ''),
    isConnected: connectedRaw === true || connectedRaw === 'true',
    createdAt: row.createdAt ? String(row.createdAt) : new Date().toISOString(),
    updatedAt: row.updatedAt ? String(row.updatedAt) : new Date().toISOString(),
    ...(meta && typeof meta === 'object'
      ? { phylloSyncMeta: meta as Record<string, unknown> }
      : {}),
    ...(demoSrc ? { demographicsSource: demoSrc } : {}),
  };
}

export function isAnalyticsNotFoundError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return (
    /\b404\b/.test(m) ||
    /not connected/i.test(m) ||
    /instagram not connected/i.test(m) ||
    /youtube not connected/i.test(m) ||
    /twitter not connected/i.test(m)
  );
}
