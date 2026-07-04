import { api } from './api';

export const rateCardsApi = {
  getMy: () => api.get('/api/rate-cards/my'),
  updateMy: (body: Record<string, unknown>) => api.put('/api/rate-cards/my', body),
  getSuggested: () => api.get('/api/rate-cards/suggested'),
  getBookings: () => api.get('/api/rate-cards/bookings'),
  getBooking: (bookingId: string) => api.get(`/api/rate-cards/bookings/${bookingId}`),
  respondBooking: (bookingId: string, status: 'accepted' | 'declined') =>
    api.put(`/api/rate-cards/bookings/${bookingId}/respond`, { status }),
  deliverBooking: (
    bookingId: string,
    body: { fileUrl?: string; driveLink?: string; deliveryType: 'file' | 'link' }
  ) => api.post(`/api/rate-cards/bookings/${bookingId}/deliver`, body),
  uploadDeliverable: async (uri: string, fileName: string, mimeType: string) => {
    const form = new FormData();
    form.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
    return api.post('/api/ugc/upload-deliverable', form);
  },
};
