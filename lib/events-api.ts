import { api } from './api';

export type EventStatus = 'draft' | 'published' | 'cancelled';
export type EventDisplayStatus = 'draft' | 'upcoming' | 'live' | 'ended' | 'cancelled';

export interface CreatorEvent {
  id: string;
  slug: string;
  url: string;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  isOnline: boolean;
  onlineUrl: string | null;
  venueName: string | null;
  address: string | null;
  capacity: number;
  showRemaining: boolean;
  currency: string;
  status: EventStatus;
  displayStatus: EventDisplayStatus;
  publishedAt: string | null;
  cancelledAt: string | null;
}

export interface EventListItem extends CreatorEvent {
  ticketsSold: number;
  revenue: number;
}

export interface EventPass {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  maxPerOrder: number;
  sortOrder: number;
  sold: number;
  remaining?: number;
}

export interface EventStats {
  ticketsSold: number;
  ticketsIssued: number;
  checkedIn: number;
  paidOrders: number;
  freeOrders: number;
  pendingOrders: number;
  revenue: number;
  platformFees: number;
  netRevenue: number;
  refundsDue: { orders: number; amount: number };
}

export interface EventDetail {
  event: CreatorEvent;
  passes: EventPass[];
  availability: { remaining: number; soldOut: boolean };
  stats: EventStats;
  paymentsEnabled: boolean;
}

export interface Attendee {
  id: string;
  code: string;
  attendeeName: string;
  status: 'valid' | 'checked_in' | 'cancelled';
  checkedInAt: string | null;
  passName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  orderStatus: string;
}

export type CheckInOutcome =
  'checked_in' | 'already_checked_in' | 'cancelled' | 'wrong_event' | 'not_found';

export interface CheckInResult {
  outcome: CheckInOutcome;
  ticket: {
    id: string;
    code: string;
    attendeeName: string;
    passName: string;
    checkedInAt: string | null;
  } | null;
}

/** What the create / edit form sends. Dates are ISO strings; "" clears an optional text field. */
export interface EventInput {
  title: string;
  description?: string;
  bannerUrl?: string | null;
  startsAt: string;
  endsAt: string;
  isOnline: boolean;
  onlineUrl?: string;
  venueName?: string;
  address?: string;
  capacity: number;
  showRemaining: boolean;
}

export interface PassInput {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  maxPerOrder: number;
}

export const eventsApi = {
  list: () =>
    api.get('/api/events') as Promise<{
      events: EventListItem[];
      paymentsEnabled: boolean;
      platformFeePercent: number;
    }>,
  get: (id: string) => api.get(`/api/events/${id}`) as Promise<EventDetail>,
  create: (body: EventInput) => api.post('/api/events', body) as Promise<{ event: CreatorEvent }>,
  update: (id: string, body: Partial<EventInput>) =>
    api.put(`/api/events/${id}`, body) as Promise<{ event: CreatorEvent }>,
  remove: (id: string) => api.delete(`/api/events/${id}`),
  publish: (id: string) =>
    api.post(`/api/events/${id}/publish`, {}) as Promise<{ event: CreatorEvent }>,
  unpublish: (id: string) =>
    api.post(`/api/events/${id}/unpublish`, {}) as Promise<{ event: CreatorEvent }>,
  cancel: (id: string) =>
    api.post(`/api/events/${id}/cancel`, {}) as Promise<{
      event: CreatorEvent;
      refundsDue: { orders: number; amount: number };
    }>,
  addPass: (id: string, body: PassInput) =>
    api.post(`/api/events/${id}/passes`, body) as Promise<{ pass: EventPass }>,
  updatePass: (id: string, passId: string, body: Partial<PassInput>) =>
    api.put(`/api/events/${id}/passes/${passId}`, body) as Promise<{ pass: EventPass }>,
  removePass: (id: string, passId: string) => api.delete(`/api/events/${id}/passes/${passId}`),
  qr: (id: string) => api.get(`/api/events/${id}/qr`) as Promise<{ url: string; svg: string }>,
  attendees: (id: string) =>
    api.get(`/api/events/${id}/attendees`) as Promise<{ attendees: Attendee[] }>,
  checkIn: (id: string, code: string) =>
    api.post(`/api/events/${id}/checkin`, { code }) as Promise<CheckInResult>,
  setTicketCheckedIn: (id: string, ticketId: string, checkedIn: boolean) =>
    api.post(`/api/events/${id}/tickets/${ticketId}/check-in`, { checkedIn }),
  uploadBanner: async (uri: string, fileName: string, mimeType: string) => {
    const form = new FormData();
    form.append('file', { uri, name: fileName, type: mimeType } as unknown as Blob);
    return api.post('/api/events/upload-banner', form) as Promise<{ url: string }>;
  },
};
