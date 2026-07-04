/** Status rail + pill tones for PremiumOpportunityCard (bookings + UGC). */
export type OpportunityStatusTone =
  | 'pending'
  | 'active'
  | 'review'
  | 'success'
  | 'declined'
  | 'warning'
  | 'neutral';

export const OPPORTUNITY_RAIL: Record<OpportunityStatusTone, string> = {
  pending: '#F59E0B',
  active: '#4F6EF7',
  review: '#8B5CF6',
  success: '#22C55E',
  declined: '#94A3B8',
  warning: '#F97316',
  neutral: '#64748B',
};

export const OPPORTUNITY_PILL_BG: Record<OpportunityStatusTone, string> = {
  pending: 'rgba(245, 158, 11, 0.18)',
  active: 'rgba(79, 110, 247, 0.18)',
  review: 'rgba(139, 92, 246, 0.18)',
  success: 'rgba(34, 197, 94, 0.18)',
  declined: 'rgba(148, 163, 184, 0.22)',
  warning: 'rgba(249, 115, 22, 0.18)',
  neutral: 'rgba(100, 116, 139, 0.15)',
};

export const OPPORTUNITY_PILL_TEXT: Record<OpportunityStatusTone, string> = {
  pending: '#B45309',
  active: '#3730A3',
  review: '#6D28D9',
  success: '#15803D',
  declined: '#64748B',
  warning: '#C2410C',
  neutral: '#475569',
};

export function platformForContentType(contentType: string): 'instagram' | 'youtube' | 'twitter' | 'ugc' {
  const k = contentType.toLowerCase();
  if (k.includes('instagram')) return 'instagram';
  if (k.includes('youtube')) return 'youtube';
  if (k.includes('twitter') || k.includes('tiktok')) return 'twitter';
  if (k.includes('ugc')) return 'ugc';
  return 'ugc';
}

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
  if (status === 'declined') return 'declined';
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
  if (status === 'pending') return 'Pending';
  if (status === 'in_progress' && d === 'pending_review') return 'In review';
  if (status === 'in_progress' && d === 'revision_requested') return 'Revision';
  if (status === 'accepted') return 'Accepted';
  if (status === 'in_progress') return 'In progress';
  return status.replace(/_/g, ' ');
}

export function ugcApplicationTone(item: {
  application?: { status?: string };
  status?: string;
  deliverable?: { status?: string } | null;
  brief?: Record<string, unknown> | null;
}): OpportunityStatusTone {
  const appStatus = item.application?.status ?? item.status ?? '';
  const d = item.deliverable?.status;
  if (d === 'approved') return 'success';
  if (d === 'pending_review') return 'review';
  if (d === 'revision_requested') return 'warning';
  if (appStatus === 'rejected') return 'declined';
  if (appStatus === 'pending') return 'pending';
  if (appStatus === 'accepted' || appStatus === 'in_progress') return 'active';
  return 'neutral';
}

export function ugcApplicationShort(item: {
  application?: { status?: string };
  status?: string;
  deliverable?: { status?: string } | null;
}): string {
  const appStatus = item.application?.status ?? item.status ?? '';
  const d = item.deliverable?.status;
  if (d === 'approved') return 'Paid';
  if (d === 'pending_review') return 'In review';
  if (d === 'revision_requested') return 'Revision';
  if (appStatus === 'accepted') return 'Accepted';
  if (appStatus === 'pending') return 'Pending';
  if (appStatus === 'rejected') return 'Declined';
  return 'Applied';
}

export function ugcJobTone(hasApplied: boolean): OpportunityStatusTone {
  return hasApplied ? 'active' : 'success';
}

export function campaignAvailableTone(status: string): OpportunityStatusTone {
  const s = String(status ?? '').trim().toLowerCase();
  if (s === 'active') return 'success';
  if (s === 'draft' || s === 'pending' || s === 'scheduled') return 'pending';
  if (s === 'completed' || s === 'closed') return 'neutral';
  return 'active';
}

export function campaignAvailableLabel(status: string): string {
  const s = String(status ?? '').trim();
  return s ? s.replace(/_/g, ' ') : 'Open';
}

export function campaignParticipationTone(
  kind: 'available' | 'applied' | 'joined'
): OpportunityStatusTone {
  if (kind === 'joined') return 'active';
  if (kind === 'applied') return 'pending';
  return 'success';
}

export function campaignParticipationLabel(
  kind: 'available' | 'applied' | 'joined',
  appStatus?: string
): string {
  if (kind === 'joined') return 'Active';
  if (kind === 'available') return 'Open';
  const st = String(appStatus ?? '').trim().toLowerCase();
  if (st === 'rejected') return 'Not approved';
  if (['applied', 'pending_review'].includes(st)) return 'Pending';
  if (['approved', 'contract_pending', 'contract_signed'].includes(st)) return 'Ready';
  return 'Applied';
}
