import { api } from './api';

export const pushApi = {
  register: (expoPushToken: string, platform: 'ios' | 'android' | 'unknown') =>
    api.post('/api/push-tokens/register', { expoPushToken, platform }),
  unregister: (expoPushToken?: string) =>
    api.delete(expoPushToken ? `/api/push-tokens?expoPushToken=${encodeURIComponent(expoPushToken)}` : '/api/push-tokens'),
};
