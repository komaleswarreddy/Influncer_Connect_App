import { api } from './api';

export type MeetServiceStatus = 'draft' | 'published';
export type MeetBookingStatus =
  'pending' | 'confirmed' | 'cancelled' | 'failed' | 'refund_due' | 'completed';

export interface MeetWindow {
  /** 0 = Sunday .. 6 = Saturday */
  weekday: number;
  /** minutes from local midnight, 0..1440 */
  startMinute: number;
  endMinute: number;
}

export interface MeetTestimonial {
  name: string;
  text: string;
}

export interface MeetService {
  id: string;
  slug: string;
  url: string;
  title: string;
  description: string;
  insights: string[];
  testimonials: MeetTestimonial[];
  durationMinutes: number;
  mrp: number;
  price: number;
  currency: string;
  timezone: string;
  status: MeetServiceStatus;
  publishedAt: string | null;
  isFree: boolean;
  windows: MeetWindow[];
}

export interface MeetServiceListItem extends MeetService {
  upcomingBookings: number;
  totalBookings: number;
}

export interface MeetGoogleStatus {
  configured: boolean;
  connected: boolean;
  needsReconnect: boolean;
  email: string | null;
}

export interface MeetEarnings {
  sessions: number;
  upcoming: number;
  gross: number;
  platformFees: number;
  net: number;
}

export interface MeetOverview {
  services: MeetServiceListItem[];
  google: MeetGoogleStatus;
  earnings: MeetEarnings;
  paymentsEnabled: boolean;
  platformFeePercent: number;
}

export interface MeetBooking {
  id: string;
  serviceId: string;
  serviceTitle: string | null;
  startsAt: string;
  endsAt: string;
  status: MeetBookingStatus;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  buyerTimezone: string | null;
  totalAmount: number;
  platformFee: number;
  currency: string;
  refundStatus: 'none' | 'pending' | 'refunded' | 'failed';
  refundAmount: number;
  cancelledBy: 'creator' | 'booker' | null;
  cancelledAt: string | null;
  rescheduleCount: number;
  meetUrl: string | null;
  paidAt: string | null;
}

export interface MeetServiceInput {
  title: string;
  description: string;
  insights: string[];
  testimonials: MeetTestimonial[];
  durationMinutes: number;
  mrp: number;
  price: number;
  timezone: string;
  windows?: MeetWindow[];
}

export const meetsApi = {
  overview: () => api.get('/api/meets') as Promise<MeetOverview>,
  get: (id: string) => api.get(`/api/meets/${id}`) as Promise<{ service: MeetService }>,
  create: (body: MeetServiceInput) =>
    api.post('/api/meets', body) as Promise<{ service: MeetService }>,
  update: (id: string, body: MeetServiceInput) =>
    api.put(`/api/meets/${id}`, body) as Promise<{ service: MeetService }>,
  remove: (id: string) => api.delete(`/api/meets/${id}`) as Promise<{ ok: true }>,
  setAvailability: (id: string, windows: MeetWindow[]) =>
    api.put(`/api/meets/${id}/availability`, { windows }) as Promise<{ service: MeetService }>,
  publish: (id: string) =>
    api.post(`/api/meets/${id}/publish`, {}) as Promise<{ service: MeetService }>,
  unpublish: (id: string) =>
    api.post(`/api/meets/${id}/unpublish`, {}) as Promise<{ service: MeetService }>,
  bookings: (scope: 'upcoming' | 'past' | 'all') =>
    api.get(`/api/meets/bookings?scope=${scope}`) as Promise<{ bookings: MeetBooking[] }>,
  booking: (id: string) =>
    api.get(`/api/meets/bookings/${id}`) as Promise<{ booking: MeetBooking }>,
  cancelBooking: (id: string) =>
    api.post(`/api/meets/bookings/${id}/cancel`, {}) as Promise<{ booking: MeetBooking }>,
  googleStatus: () => api.get('/api/meets/google/status') as Promise<MeetGoogleStatus>,
  googleConnect: () => api.post('/api/meets/google/connect', {}) as Promise<{ url: string }>,
  googleDisconnect: () => api.delete('/api/meets/google') as Promise<{ ok: true }>,
};
