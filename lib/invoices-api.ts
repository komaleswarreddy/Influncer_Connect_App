import { api, getApiBaseUrl } from './api';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';
/** `overdue` is derived by the server: a sent invoice past its due date. */
export type InvoiceDisplayStatus = InvoiceStatus | 'overdue';
export type InvoiceDiscountType = 'none' | 'percent' | 'flat';
export type InvoiceListFilter = 'all' | InvoiceStatus | 'overdue';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  displayStatus: InvoiceDisplayStatus;
  brandName: string;
  contactName: string | null;
  brandEmail: string | null;
  billingAddress: string | null;
  brandGstin: string | null;
  fromName: string | null;
  fromEmail: string | null;
  fromAddress: string | null;
  fromGstin: string | null;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  discountType: InvoiceDiscountType;
  discountValue: number;
  discountAmount: number;
  taxLabel: string;
  taxPercent: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  paymentDetails: string | null;
  sentAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
}

export interface InvoiceSummary {
  totalCount: number;
  draftCount: number;
  outstanding: number;
  overdueAmount: number;
  overdueCount: number;
  paidTotal: number;
}

export interface InvoiceDefaults {
  nextInvoiceNumber: string;
  today: string;
  fromName: string | null;
  fromEmail: string | null;
  fromAddress: string | null;
  fromGstin: string | null;
  currency: string;
  taxLabel: string;
  taxPercent: number;
  paymentDetails: string | null;
}

/** What the create / edit form submits. Totals are never sent: the server recomputes every amount. */
export interface InvoiceInput {
  brandName: string;
  contactName?: string;
  brandEmail?: string;
  billingAddress?: string;
  brandGstin?: string;
  fromName?: string;
  fromEmail?: string;
  fromAddress?: string;
  fromGstin?: string;
  issueDate?: string;
  dueDate: string;
  currency?: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  discountType: InvoiceDiscountType;
  discountValue: number;
  taxLabel?: string;
  taxPercent: number;
  notes?: string;
  paymentDetails?: string;
}

export const invoicesApi = {
  defaults: () => api.get('/api/invoices/defaults') as Promise<InvoiceDefaults>,
  list: (params?: { status?: InvoiceListFilter; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== 'all') qs.set('status', params.status);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const query = qs.toString();
    return api.get(`/api/invoices${query ? `?${query}` : ''}`) as Promise<{
      invoices: Invoice[];
      summary: InvoiceSummary;
    }>;
  },
  get: (id: string) => api.get(`/api/invoices/${id}`) as Promise<{ invoice: Invoice }>,
  create: (body: InvoiceInput) => api.post('/api/invoices', body) as Promise<{ invoice: Invoice }>,
  update: (id: string, body: InvoiceInput) =>
    api.put(`/api/invoices/${id}`, body) as Promise<{ invoice: Invoice }>,
  remove: (id: string) => api.delete(`/api/invoices/${id}`),
  send: (id: string, body?: { to?: string; message?: string }) =>
    api.post(`/api/invoices/${id}/send`, body ?? {}) as Promise<{
      invoice: Invoice;
      emailedTo: string;
    }>,
  markPaid: (id: string) =>
    api.post(`/api/invoices/${id}/mark-paid`, {}) as Promise<{ invoice: Invoice }>,
  cancel: (id: string) =>
    api.post(`/api/invoices/${id}/cancel`, {}) as Promise<{ invoice: Invoice }>,
  /** Short-lived signed URL (10 min) the system viewer can open without our bearer header. */
  pdfUrl: async (id: string): Promise<string> => {
    const res = (await api.post(`/api/invoices/${id}/pdf-link`, {})) as { path: string };
    return `${getApiBaseUrl()}${res.path}`;
  },
};
