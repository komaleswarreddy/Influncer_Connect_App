import { api } from './api';

export type ReferralStatus = 'signed_up' | 'qualified' | 'paid';

export interface ReferralFriend {
  id: string;
  /** Already masked by the server: first name + last initial. */
  name: string;
  status: ReferralStatus;
  rewardAmount: number;
  currency: string;
  createdAt: string;
  qualifiedAt: string | null;
  paidAt: string | null;
}

export interface ReferralOverview {
  code: string;
  rewardAmount: number;
  currency: string;
  shareUrl: string;
  shareMessage: string;
  stats: {
    invited: number;
    qualified: number;
    paid: number;
    pendingAmount: number;
    paidAmount: number;
    earnedAmount: number;
  };
  referrals: ReferralFriend[];
  referredBy: { code: string } | null;
  canApplyCode: boolean;
  applyWindowDays: number;
}

export const referralsApi = {
  me: () => api.get('/api/referrals/me') as Promise<ReferralOverview>,
  apply: (code: string) => api.post('/api/referrals/apply', { code }),
};
