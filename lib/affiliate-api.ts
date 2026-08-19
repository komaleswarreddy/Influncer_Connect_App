import { api, getApiBaseUrl } from './api';

export type TrackingLink = {
  id: string;
  productId: string;
  trackingCode: string;
  totalClicks: number;
  totalConversions: number;
  totalSales: number;
  product: { name?: string; sku?: string } | null;
};

export type EligibleProduct = {
  id: string;
  name: string;
  sku: string;
  hasTrackingLink: boolean;
};

export function trackingClickUrl(code: string): string {
  return `${getApiBaseUrl()}/api/tracking/click/${encodeURIComponent(code)}`;
}

export const affiliateApi = {
  listLinks: async (): Promise<TrackingLink[]> => {
    const res = (await api.get('/api/affiliates/tracking-links')) as { data?: unknown[] };
    const rows = (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []) as Record<
      string,
      unknown
    >[];
    return rows.map((link) => ({
      id: String(link.id),
      productId: String(link.productId),
      trackingCode: String(link.trackingCode),
      totalClicks: Number(link.totalClicks ?? 0),
      totalConversions: Number(link.totalConversions ?? 0),
      totalSales:
        typeof link.totalSales === 'string'
          ? parseFloat(link.totalSales)
          : Number(link.totalSales ?? 0),
      product: (link.product as TrackingLink['product']) ?? null,
    }));
  },
  eligibleProducts: async (): Promise<EligibleProduct[]> => {
    const res = (await api.get('/api/affiliates/tracking-links/eligible-products')) as {
      data?: EligibleProduct[];
    };
    return (res?.data ?? res ?? []) as EligibleProduct[];
  },
  createLink: (productId: string) => api.post('/api/affiliates/tracking-links', { productId }),
  deleteLink: (id: string) => api.delete(`/api/affiliates/tracking-links/${id}`),
};
