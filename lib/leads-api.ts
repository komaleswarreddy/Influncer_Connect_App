import { api } from './api';

export type LeadStage = 'new' | 'contacted' | 'won' | 'lost';
export type LeadSource = 'media_kit' | 'manual';
export type LeadFilter = 'all' | LeadStage;

export const LEAD_STAGES: { key: LeadStage; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

export interface Lead {
  id: string;
  source: LeadSource;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  budgetText: string | null;
  message: string | null;
  notes: string | null;
  stage: LeadStage;
  valueAmount: number | null;
  isRead: boolean;
  lastContactedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadSummary {
  total: number;
  new: number;
  contacted: number;
  won: number;
  lost: number;
  unread: number;
  wonValue: number;
}

/** What the add / edit form sends. Empty strings clear a field. */
export interface LeadInput {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  budgetText?: string;
  message?: string;
  notes?: string;
  stage?: LeadStage;
  valueAmount?: number | null;
}

export const leadsApi = {
  list: (params?: { stage?: LeadFilter; q?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.stage && params.stage !== 'all') qs.set('stage', params.stage);
    if (params?.q?.trim()) qs.set('q', params.q.trim());
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const query = qs.toString();
    return api.get(`/api/leads${query ? `?${query}` : ''}`) as Promise<{
      leads: Lead[];
      summary: LeadSummary;
    }>;
  },
  get: (id: string) => api.get(`/api/leads/${id}`) as Promise<{ lead: Lead }>,
  create: (body: LeadInput) => api.post('/api/leads', body) as Promise<{ lead: Lead }>,
  update: (id: string, body: Partial<LeadInput>) =>
    api.put(`/api/leads/${id}`, body) as Promise<{ lead: Lead }>,
  setStage: (id: string, stage: LeadStage, valueAmount?: number | null) =>
    api.post(`/api/leads/${id}/stage`, {
      stage,
      ...(valueAmount !== undefined ? { valueAmount } : {}),
    }) as Promise<{ lead: Lead }>,
  remove: (id: string) => api.delete(`/api/leads/${id}`),
};
