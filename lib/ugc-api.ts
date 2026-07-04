import { api } from './api';

export const ugcApi = {
  marketplace: () => api.get('/api/ugc/marketplace'),
  getBrief: (briefId: string) => api.get(`/api/ugc/briefs/${briefId}`),
  apply: (briefId: string, body: { coverNote?: string }) =>
    api.post(`/api/ugc/briefs/${briefId}/apply`, body),
  myApplications: () => api.get('/api/ugc/my-applications'),
  myEarnings: () => api.get('/api/ugc/my-earnings'),
  deliver: (applicationId: string, body: { fileUrl?: string; driveLink?: string; deliveryType: 'file' | 'link' }) =>
    api.post(`/api/ugc/applications/${applicationId}/deliver`, body),
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
