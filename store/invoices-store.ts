import { create } from 'zustand';
import { useAuthStore } from './auth-store';
import {
  invoicesApi,
  type Invoice,
  type InvoiceListFilter,
  type InvoiceSummary,
} from '@/lib/invoices-api';

const EMPTY_SUMMARY: InvoiceSummary = {
  totalCount: 0,
  draftCount: 0,
  outstanding: 0,
  overdueAmount: 0,
  overdueCount: 0,
  paidTotal: 0,
};

interface InvoicesState {
  invoices: Invoice[];
  summary: InvoiceSummary;
  filter: InvoiceListFilter;
  isLoading: boolean;
  error: string | null;
  setFilter: (filter: InvoiceListFilter) => void;
  fetchInvoices: (filter?: InvoiceListFilter) => Promise<void>;
  reset: () => void;
}

export const useInvoicesStore = create<InvoicesState>((set, get) => ({
  invoices: [],
  summary: EMPTY_SUMMARY,
  filter: 'all',
  isLoading: false,
  error: null,

  setFilter: (filter) => set({ filter }),

  fetchInvoices: async (filterArg) => {
    const filter = filterArg ?? get().filter;
    set({ isLoading: true, error: null });
    try {
      const res = await invoicesApi.list({ status: filter, limit: 100 });
      // Ignore a stale response if the user switched filter while this one was in flight.
      if (get().filter !== filter) return;
      set({
        invoices: res.invoices ?? [],
        summary: res.summary ?? EMPTY_SUMMARY,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load invoices',
        isLoading: false,
      });
    }
  },

  reset: () =>
    set({ invoices: [], summary: EMPTY_SUMMARY, filter: 'all', error: null, isLoading: false }),
}));

// Invoices are private to a creator: drop the cached list the moment the signed-in user changes or logs out.
let lastUserId = useAuthStore.getState().user?.id ?? null;
useAuthStore.subscribe((state) => {
  const id = state.user?.id ?? null;
  if (id !== lastUserId) {
    lastUserId = id;
    useInvoicesStore.getState().reset();
  }
});
