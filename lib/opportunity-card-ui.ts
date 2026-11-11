/** Status rail + pill tones for PremiumOpportunityCard (bookings + UGC). */
import {
  canOpenCampaignContract,
  isParticipationEnrolled,
  normParticipationStatus,
} from '@/lib/campaign-participation-ui';
export type OpportunityStatusTone =
  'pending' | 'active' | 'review' | 'success' | 'declined' | 'warning' | 'neutral';

export const OPPORTUNITY_RAIL: Record<OpportunityStatusTone, string> = {
  pending: '#F59E0B',
  active: '#4F6EF7',
  review: '#8B5CF6',
  success: '#22C55E',
  declined: '#94A3B8',
  warning: '#F97316',
  neutral: '#64748B',
};

const CONTENT_LABELS: Record<string, string> = {
  instagram_reel: 'Instagram Reel',
  instagram_post: 'Instagram Post',
  instagram_story: 'Instagram Story',
  youtube_integration: 'YouTube Integration',
  youtube_dedicated: 'YouTube Dedicated',
  tiktok_video: 'TikTok Video',
  ugc_video: 'UGC Video',
  ugc_photo: 'UGC Photo',
  appearance_fee: 'Appearance',
  consultation_fee: 'Consultation',
};

export function labelForContentType(key: string): string {
  return CONTENT_LABELS[key] ?? key.replace(/_/g, ' ');
}

export function bookingStatusTone(
  status: string,
  deliverable?: { status?: string } | null
): OpportunityStatusTone {
  const d = deliverable?.status;
  if (status === 'completed') return 'success';
  if (status === 'declined' || status === 'cancelled') return 'declined';
  if (status === 'cancel_requested') return 'warning';
  if (status === 'pending') return 'pending';
  if (status === 'in_progress' && d === 'pending_review') return 'review';
  if (status === 'in_progress' && d === 'revision_requested') return 'warning';
  if (status === 'accepted' || status === 'in_progress') return 'active';
  return 'neutral';
}

export function bookingStatusShort(
  status: string,
  deliverable?: { status?: string } | null
): string {
  const d = deliverable?.status;
  if (status === 'completed') return 'Completed';
  if (status === 'declined') return 'Declined';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'cancel_requested') return 'Cancel requested';
  if (status === 'pending') return 'Pending';
  if (status === 'in_progress' && d === 'pending_review') return 'In review';
  if (status === 'in_progress' && d === 'revision_requested') return 'Revision';
  if (status === 'accepted') return 'Accepted';
  if (status === 'in_progress') return 'In progress';
  return status.replace(/_/g, ' ');
}

type MineParticipationContext = {
  id?: string;
  campaignId?: string;
  status?: string;
  inviteId?: string | null;
  campaign?: { id?: string } | null;
};

type MineApplicationContext = {
  campaignId?: string;
  campaign?: { id?: string };
  status?: string;
};

/** Status pill for My Campaigns cards — mirrors Campaign Details flow. */
export function buildMineCampaignStatus(
  campaignId: string,
  participations: MineParticipationContext[] | undefined,
  applications: MineApplicationContext[] | undefined
): { label: string; tone: OpportunityStatusTone } {
  const cid = String(campaignId ?? '')
    .trim()
    .toLowerCase();
  const participation = (participations ?? []).find((p) => {
    if (!p) return false;
    const pid = String(p.campaignId ?? '')
      .trim()
      .toLowerCase();
    const nested = String(p.campaign?.id ?? '')
      .trim()
      .toLowerCase();
    return pid === cid || nested === cid;
  });
  const application = (applications ?? []).find((a) => {
    if (!a) return false;
    const aid = String(a.campaignId ?? '')
      .trim()
      .toLowerCase();
    const nested = String(a.campaign?.id ?? '')
      .trim()
      .toLowerCase();
    return aid === cid || nested === cid;
  });

  const pSt = normParticipationStatus(participation?.status);
  const appSt = normParticipationStatus(application?.status);
  const enrolled = isParticipationEnrolled(participation, appSt);
  const canShowContract = canOpenCampaignContract(participation, application);

  if (enrolled && pSt === 'completed') return { label: 'Completed', tone: 'success' };
  if (enrolled) return { label: 'Active', tone: 'active' };
  if (canShowContract) return { label: 'Open contract', tone: 'review' };
  if (appSt === 'approved' && !participation?.id) {
    return { label: 'Approved', tone: 'active' };
  }
  if (['applied', 'pending_review'].includes(appSt) && !participation) {
    return { label: 'Submitted', tone: 'pending' };
  }
  if (appSt === 'rejected') return { label: 'Not approved', tone: 'declined' };
  if (participation) {
    const label = pSt ? pSt.replace(/_/g, ' ') : 'In progress';
    return { label: label.charAt(0).toUpperCase() + label.slice(1), tone: 'neutral' };
  }
  return { label: 'Applied', tone: 'pending' };
}
