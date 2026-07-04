import { create } from 'zustand';
import { ugcApi } from '@/lib/ugc-api';

export type UgcDeliverableSummary = {
  id?: string;
  status?: string;
  fileUrl?: string | null;
  driveLink?: string | null;
};

export type UgcPaymentSummary = {
  status?: string;
  netAmount?: number;
  grossAmount?: number;
};

export type UgcApplicationRow = {
  application?: {
    id: string;
    status: string;
    coverNote?: string | null;
  };
  brief?: Record<string, unknown> | null;
  deliverable?: UgcDeliverableSummary | null;
  payment?: UgcPaymentSummary | null;
  id?: string;
  status?: string;
};

function normalizeApplications(raw: Array<Record<string, unknown>>): UgcApplicationRow[] {
  return raw.map((row) => {
    if (row.application && typeof row.application === 'object') {
      return {
        ...(row as UgcApplicationRow),
        deliverable: (row.deliverable as UgcDeliverableSummary) ?? null,
        payment: (row.payment as UgcPaymentSummary) ?? null,
      };
    }
    return {
      application: {
        id: String(row.id ?? ''),
        status: String(row.status ?? ''),
        coverNote: row.coverNote as string | null | undefined,
      },
      brief: (row.brief as Record<string, unknown>) ?? null,
      deliverable: (row.deliverable as UgcDeliverableSummary) ?? null,
      payment: (row.payment as UgcPaymentSummary) ?? null,
    };
  });
}

export function appFromRow(item: UgcApplicationRow) {
  if (item.application) return item.application;
  return { id: String(item.id ?? ''), status: String(item.status ?? '') };
}

export function deliverableStatus(item: UgcApplicationRow): string | null {
  const s = item.deliverable?.status;
  return s ? String(s) : null;
}

/** Influencer can open deliver screen when brand accepted and not already pending review. */
export function canDeliverContent(item: UgcApplicationRow): boolean {
  const appStatus = appFromRow(item).status;
  const dStatus = deliverableStatus(item);
  if (dStatus === 'pending_review') return false;
  if (dStatus === 'approved') return false;
  if (appStatus === 'accepted') return true;
  if (appStatus === 'in_progress' && dStatus === 'revision_requested') return true;
  return false;
}

export function applicationStatusLabel(item: UgcApplicationRow): string {
  const appStatus = appFromRow(item).status;
  const dStatus = deliverableStatus(item);
  if (dStatus === 'pending_review') return 'Submitted — awaiting brand review';
  if (dStatus === 'revision_requested') return 'Revision requested — resubmit content';
  if (dStatus === 'approved') return 'Approved — payment released';
  if (dStatus === 'rejected') return 'Deliverable rejected';
  if (appStatus === 'accepted') return 'Accepted — tap to deliver content';
  if (appStatus === 'pending') return 'Pending brand review';
  if (appStatus === 'rejected') return 'Declined by brand';
  return appStatus || '—';
}

interface UgcStore {
  jobs: Array<Record<string, unknown>>;
  applications: UgcApplicationRow[];
  loading: boolean;
  error: string | null;
  segment: 'jobs' | 'applications';
  setSegment: (s: 'jobs' | 'applications') => void;
  fetchJobs: () => Promise<void>;
  fetchApplications: () => Promise<void>;
}

export const useUgcStore = create<UgcStore>((set) => ({
  jobs: [],
  applications: [],
  loading: false,
  error: null,
  segment: 'jobs',
  setSegment: (segment) => set({ segment, error: null }),
  fetchJobs: async () => {
    set({ loading: true, error: null });
    try {
      const res = (await ugcApi.marketplace()) as {
        briefs?: Array<Record<string, unknown>>;
        jobs?: Array<Record<string, unknown>>;
      };
      set({ jobs: res.briefs ?? res.jobs ?? [] });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load UGC jobs';
      console.error('[ugc-store] marketplace failed:', e);
      set({ jobs: [], error: message });
    } finally {
      set({ loading: false });
    }
  },
  fetchApplications: async () => {
    set({ loading: true, error: null });
    try {
      const res = (await ugcApi.myApplications()) as {
        applications?: Array<Record<string, unknown>>;
      };
      set({ applications: normalizeApplications(res.applications ?? []) });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load applications';
      console.error('[ugc-store] my-applications failed:', e);
      set({ applications: [], error: message });
    } finally {
      set({ loading: false });
    }
  },
}));
