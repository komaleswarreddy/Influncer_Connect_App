import { isParticipationEnrolled, normParticipationStatus } from '@/lib/campaign-participation-ui';
import type { CampaignParticipation } from '@/store/campaign-store';

/** Existing user for Home: enrolled in at least one campaign. */
export function isExistingCampaignUser(
  participations: {
    status?: string | null;
    influencer_signature?: string | null;
  }[]
): boolean {
  return participations.some((p) => isParticipationEnrolled(p));
}

/** Ongoing / active rows for My Campaigns accordion. */
export function getActiveParticipations(
  participations: CampaignParticipation[]
): CampaignParticipation[] {
  return participations.filter((p) => {
    const st = normParticipationStatus(p.status);
    return st === 'active' || st === 'joined';
  });
}

export function participationCampaignId(p: CampaignParticipation): string {
  return String(p.campaignId ?? p.campaign?.id ?? '').trim();
}

export function participationCampaignName(p: CampaignParticipation): string {
  return p.campaign?.name?.trim() || 'Campaign';
}

export function participationBrandLabel(p: CampaignParticipation): string {
  return p.campaign?.tenant?.tenantName?.trim() || 'Brand';
}
