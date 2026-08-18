import { api, getApiBaseUrl } from './api';

export interface PostMetrics {
  platform: string;
  contentType: string;
  url: string;
  likes: number;
  comments: number;
  shares?: number;
  views?: number;
  engagementRate: number;
  title?: string;
  caption?: string;
  thumbnail?: string;
  publishedAt?: string;
  duration?: string;
  creatorUsername: string;
  creatorFullName?: string;
  creatorProfilePic?: string;
  creatorFollowers: number;
  creatorIsVerified: boolean;
  authenticityScore: number;
  authenticityGrade: string;
  authenticitySignals: {
    engagementQuality: number;
    followerEngagementRatio: number;
    dataSourceQuality: number;
    profileCompleteness: number;
    verificationStatus: number;
    breakdown: string[];
  };
  fetchedAt: string;
  dataSource: string;
  error?: string;
}

export interface BulkAnalysisResult {
  success?: boolean;
  results: Array<PostMetrics & { analysisId?: string | null }>;
  errors: Array<{ url: string; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    youtubeApiUnitsUsed: number;
    scrapeCreditsUsed: number;
    savedToDb?: number;
    persistFailed?: number;
  };
}

export interface PostAnalysis extends PostMetrics {
  id: string;
  campaignId?: string;
  createdAt: string;
  rawMetrics?: Record<string, unknown> | null;
}

export class PostAnalyzerDailyLimitError extends Error {
  readonly code = 'DAILY_LIMIT_REACHED';
  readonly limit: number;
  readonly used: number;
  readonly remaining: number;
  readonly resetsAt: string;

  constructor(payload: {
    message: string;
    limit: number;
    used: number;
    remaining: number;
    resetsAt: string;
  }) {
    super(payload.message);
    this.name = 'PostAnalyzerDailyLimitError';
    this.limit = payload.limit;
    this.used = payload.used;
    this.remaining = payload.remaining;
    this.resetsAt = payload.resetsAt;
  }
}

export function isPostAnalyzerDailyLimitError(message: string | null | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes('daily limit') || lower.includes('post analyses for today');
}

export interface PostAnalyzerQuota {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
}

interface AnalyzePostResponse {
  success?: boolean;
  data?: PostMetrics;
  metrics?: PostMetrics;
  analysisId?: string | null;
  persisted?: boolean;
  persistError?: string | null;
  error?: string;
  message?: string;
  limit?: number;
  used?: number;
  remaining?: number;
  resetsAt?: string;
}

function throwIfDailyLimit(raw: AnalyzePostResponse, status?: number) {
  if (
    status === 429 ||
    raw.error === 'DAILY_LIMIT_REACHED' ||
    (raw.message && isPostAnalyzerDailyLimitError(raw.message))
  ) {
    throw new PostAnalyzerDailyLimitError({
      message:
        raw.message ??
        'Daily analysis limit reached. Your free analysis resets at midnight (UTC). Re-checking a URL you already analyzed today does not use another slot.',
      limit: Number(raw.limit ?? 1),
      used: Number(raw.used ?? 1),
      remaining: Number(raw.remaining ?? 0),
      resetsAt: raw.resetsAt ?? new Date().toISOString(),
    });
  }
}

export async function getPostAnalyzerQuota(): Promise<PostAnalyzerQuota> {
  const raw = (await api.get('/api/post-analyzer/quota')) as PostAnalyzerQuota;
  return {
    limit: Number(raw.limit ?? 1),
    used: Number(raw.used ?? 0),
    remaining: Number(raw.remaining ?? 0),
    resetsAt: raw.resetsAt ?? new Date().toISOString(),
  };
}

export async function analyzePost(
  url: string,
  campaignId?: string
): Promise<{
  success: boolean;
  data: PostMetrics;
  analysisId: string | null;
  persisted: boolean;
  persistError: string | null;
}> {
  let raw: AnalyzePostResponse;
  try {
    raw = (await api.post('/api/post-analyzer/analyze', {
      url,
      campaignId,
    })) as AnalyzePostResponse;
  } catch (err) {
    if (err instanceof Error && isPostAnalyzerDailyLimitError(err.message)) {
      throw new PostAnalyzerDailyLimitError({
        message: err.message,
        limit: 1,
        used: 1,
        remaining: 0,
        resetsAt: new Date().toISOString(),
      });
    }
    throw err;
  }
  throwIfDailyLimit(raw);
  const metrics = raw.data ?? raw.metrics;
  if (!metrics) {
    throw new Error('Analyze response missing metrics data');
  }
  const normalizedMetrics: PostMetrics = {
    ...metrics,
    engagementRate: Number(metrics.engagementRate ?? 0),
    likes: Number(metrics.likes ?? 0),
    comments: Number(metrics.comments ?? 0),
    shares: metrics.shares === undefined ? undefined : Number(metrics.shares ?? 0),
    views: metrics.views === undefined ? undefined : Number(metrics.views ?? 0),
    creatorFollowers: Number(metrics.creatorFollowers ?? 0),
    authenticityScore: Number(metrics.authenticityScore ?? 0),
  };
  return {
    success: raw.success ?? true,
    data: normalizedMetrics,
    analysisId: raw.analysisId ?? null,
    persisted: raw.persisted ?? Boolean(raw.analysisId),
    persistError: raw.persistError ?? null,
  };
}

export async function analyzeBulkPosts(
  urls: string[],
  campaignId?: string
): Promise<BulkAnalysisResult> {
  let raw: Partial<BulkAnalysisResult> & {
    error?: string;
    message?: string;
    limit?: number;
    used?: number;
    remaining?: number;
    resetsAt?: string;
  };
  try {
    raw = (await api.post('/api/post-analyzer/analyze-bulk', {
      urls,
      campaignId,
    })) as typeof raw;
  } catch (err) {
    if (err instanceof Error && isPostAnalyzerDailyLimitError(err.message)) {
      throw new PostAnalyzerDailyLimitError({
        message: err.message,
        limit: 1,
        used: 1,
        remaining: 0,
        resetsAt: new Date().toISOString(),
      });
    }
    throw err;
  }
  throwIfDailyLimit(raw as AnalyzePostResponse);
  return {
    success: raw.success ?? true,
    results: Array.isArray(raw.results)
      ? raw.results.map((m) => ({
          ...m,
          engagementRate: Number(m.engagementRate ?? 0),
          likes: Number(m.likes ?? 0),
          comments: Number(m.comments ?? 0),
          shares: m.shares === undefined ? undefined : Number(m.shares ?? 0),
          views: m.views === undefined ? undefined : Number(m.views ?? 0),
          creatorFollowers: Number(m.creatorFollowers ?? 0),
          authenticityScore: Number(m.authenticityScore ?? 0),
          analysisId: (m as { analysisId?: string | null }).analysisId ?? null,
        }))
      : [],
    errors: Array.isArray(raw.errors) ? raw.errors : [],
    summary: {
      total: Number(raw.summary?.total ?? urls.length),
      successful: Number(
        raw.summary?.successful ?? (Array.isArray(raw.results) ? raw.results.length : 0)
      ),
      failed: Number(raw.summary?.failed ?? (Array.isArray(raw.errors) ? raw.errors.length : 0)),
      youtubeApiUnitsUsed: Number(raw.summary?.youtubeApiUnitsUsed ?? 0),
      scrapeCreditsUsed: Number(raw.summary?.scrapeCreditsUsed ?? 0),
      savedToDb: Number(raw.summary?.savedToDb ?? 0),
      persistFailed: Number(raw.summary?.persistFailed ?? 0),
    },
  };
}

function asHttpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.replace(/&amp;/g, '&').trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return undefined;
  const withProto = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
  if (!/^https?:\/\//i.test(withProto)) return undefined;
  return withProto;
}

function rawObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

const THUMB_KEYS = [
  'thumbnail',
  'thumbnailUrl',
  'thumbnail_url',
  'thumbnail_src',
  'thumbnailSrc',
  'display_url',
  'displayUrl',
  'image',
  'imageUrl',
  'image_url',
  'coverUrl',
  'cover',
  'src',
  'url',
] as const;

function pushUrl(out: string[], seen: Set<string>, value: unknown) {
  const url = asHttpUrl(value);
  if (!url || seen.has(url)) return;
  const lower = url.toLowerCase();
  const looksLikeImage =
    /cdninstagram|fbcdn\.net|scontent|ytimg|ggpht|i\.ytimg|\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(
      lower
    );
  if (!looksLikeImage) return;
  seen.add(url);
  out.push(url);
}

function collectFromNode(out: string[], seen: Set<string>, node: unknown, depth: number) {
  if (depth > 5 || node == null) return;
  if (typeof node === 'string') {
    pushUrl(out, seen, node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) collectFromNode(out, seen, item, depth + 1);
    return;
  }
  if (typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  for (const key of THUMB_KEYS) {
    if (key in obj) pushUrl(out, seen, obj[key]);
  }
  const versions = rawObject(obj.image_versions2);
  const candidates = Array.isArray(versions.candidates) ? versions.candidates : [];
  for (const cand of candidates) {
    pushUrl(out, seen, rawObject(cand).url);
  }
  const resources = obj.display_resources;
  if (Array.isArray(resources)) {
    for (const res of resources) pushUrl(out, seen, rawObject(res).src);
  }
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'owner' || key === 'user' || key === 'authenticitySignals') continue;
    collectFromNode(out, seen, value, depth + 1);
  }
}

/** Ordered thumbnail candidates — Instagram stores the preview under nested Graph keys. */
export function postAnalysisThumbnailCandidates(item: {
  thumbnail?: string | null;
  platform?: string | null;
  creatorProfilePic?: string | null;
  rawMetrics?: Record<string, unknown> | null;
  raw_metrics?: unknown;
}): string[] {
  const raw = rawObject(item.rawMetrics ?? item.raw_metrics);
  const out: string[] = [];
  const seen = new Set<string>();
  pushUrl(out, seen, item.thumbnail);
  collectFromNode(out, seen, raw, 0);
  pushUrl(out, seen, item.creatorProfilePic);
  pushUrl(out, seen, raw.creatorProfilePic);
  return out;
}

/** History rows store the preview image on `raw_metrics`, not a top-level column. */
export function postAnalysisThumbnail(item: {
  thumbnail?: string | null;
  rawMetrics?: Record<string, unknown> | null;
  creatorProfilePic?: string | null;
  platform?: string | null;
}): string | undefined {
  return postAnalysisThumbnailCandidates(item)[0];
}

export function postAnalyzerThumbProxyUri(analysisId: string): string {
  return `${getApiBaseUrl()}/api/post-analyzer/thumbnail/${encodeURIComponent(analysisId)}`;
}

export function postNeedsThumbProxy(item: {
  id?: string;
  platform?: string | null;
  thumbnail?: string | null;
}): boolean {
  if (!item.id) return false;
  const thumb = String(item.thumbnail || '');
  if (/res\.cloudinary\.com|ytimg|ggpht/i.test(thumb)) return false;
  const platform = String(item.platform || '');
  return (
    /instagram|tiktok|facebook/i.test(platform) ||
    /cdninstagram|fbcdn|scontent|tiktokcdn/i.test(thumb)
  );
}

/** URLs the app can load directly. Instagram/TikTok CDNs are excluded on purpose. */
export function postAnalysisDisplayThumb(item: {
  id?: string;
  thumbnail?: string | null;
  platform?: string | null;
  creatorProfilePic?: string | null;
  rawMetrics?: Record<string, unknown> | null;
  raw_metrics?: unknown;
}): { kind: 'owned' | 'proxy'; uri: string } | null {
  const owned = postAnalysisThumbnailCandidates(item).find((url) =>
    /res\.cloudinary\.com|ytimg|ggpht/i.test(url)
  );
  if (owned) return { kind: 'owned', uri: owned };
  if (item.id && postNeedsThumbProxy(item)) {
    return { kind: 'proxy', uri: postAnalyzerThumbProxyUri(item.id) };
  }
  return null;
}

function normalizeHistoryItem(row: PostAnalysis & { raw_metrics?: unknown }): PostAnalysis {
  const raw = rawObject(row.rawMetrics ?? row.raw_metrics);
  const likes = Number(row.likes ?? raw.likes ?? 0);
  const viewsRaw = row.views ?? raw.views;
  const engagement = Number(row.engagementRate ?? raw.engagementRate ?? 0);
  return {
    ...row,
    rawMetrics: raw,
    thumbnail: postAnalysisThumbnail({ ...row, rawMetrics: raw }),
    likes: Number.isFinite(likes) ? likes : 0,
    views: viewsRaw == null ? undefined : Number(viewsRaw),
    engagementRate: Number.isFinite(engagement) ? engagement : 0,
    contentType: String(row.contentType || raw.contentType || row.platform || 'Post'),
    url: String(row.url || raw.url || ''),
  };
}

export async function getPostAnalysisHistory(params: {
  campaignId?: string;
  limit?: number;
  page?: number;
}): Promise<{ data: PostAnalysis[]; total: number; page: number }> {
  const query = new URLSearchParams();
  if (params.campaignId) query.set('campaignId', params.campaignId);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.page) query.set('page', String(params.page));
  const suffix = query.toString();
  const raw = (await api.get(`/api/post-analyzer/history${suffix ? `?${suffix}` : ''}`)) as
    | { data?: PostAnalysis[]; items?: PostAnalysis[]; total?: number; page?: number }
    | PostAnalysis[];

  if (Array.isArray(raw)) {
    const data = raw.map((row) => normalizeHistoryItem(row));
    return { data, total: data.length, page: params.page ?? 1 };
  }

  const list = Array.isArray(raw.data) ? raw.data : Array.isArray(raw.items) ? raw.items : [];
  const data = list.map((row) => normalizeHistoryItem(row));
  return {
    data,
    total: Number(raw.total ?? data.length),
    page: Number(raw.page ?? params.page ?? 1),
  };
}
