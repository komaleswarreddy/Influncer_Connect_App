import { api } from './api';

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
    return { data: raw, total: raw.length, page: params.page ?? 1 };
  }

  const list = Array.isArray(raw.data) ? raw.data : Array.isArray(raw.items) ? raw.items : [];
  return {
    data: list,
    total: Number(raw.total ?? list.length),
    page: Number(raw.page ?? params.page ?? 1),
  };
}
