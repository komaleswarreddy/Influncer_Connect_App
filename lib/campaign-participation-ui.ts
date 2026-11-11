/** Participation + application helpers for contract / mine-campaign UI. */

export function normParticipationStatus(status?: string | null): string {
  return String(status ?? '')
    .trim()
    .toLowerCase();
}

/** Campaign id from an application or similar row (camel or snake case). */
export function applicationCampaignId(
  row?: {
    campaignId?: unknown;
    campaign_id?: unknown;
    campaign?: { id?: unknown } | null;
  } | null
): string {
  const nested = row?.campaign && typeof row.campaign === 'object' ? row.campaign.id : undefined;
  return String(row?.campaignId ?? row?.campaign_id ?? nested ?? '')
    .trim()
    .toLowerCase();
}
/** Contract signed and influencer is enrolled — no more signing needed. */
export function isParticipationEnrolled(
  participation?: {
    status?: string | null;
    influencer_signature?: string | null;
  } | null,
  applicationStatus?: string | null
): boolean {
  const pSt = normParticipationStatus(participation?.status);
  const appSt = normParticipationStatus(applicationStatus);
  // A creator who left is no longer in the collab, even though the old signature is still on the record.
  if (pSt === 'withdrawn') return false;
  if (['active', 'completed', 'joined'].includes(pSt)) return true;
  if (appSt === 'contract_signed') return true;
  if (Boolean(participation?.influencer_signature?.trim())) return true;
  return false;
}

/** Influencer still needs to open and sign the contract. */
export function canOpenCampaignContract(
  participation?: {
    id?: string | null;
    status?: string | null;
    inviteId?: string | null;
    influencer_signature?: string | null;
  } | null,
  application?: { status?: string | null } | null
): boolean {
  if (!participation?.id) return false;
  if (isParticipationEnrolled(participation, application?.status)) return false;

  const pSt = normParticipationStatus(participation.status);
  const appSt = normParticipationStatus(application?.status);
  const inviteBacked =
    participation.inviteId != null && String(participation.inviteId).trim() !== '';
  const legacyNoApplication = !application;
  const needsSigning = ['contract_pending', 'invited', 'accepted'].includes(pSt);
  const approvedReady = appSt === 'approved';

  return needsSigning && (inviteBacked || approvedReady || legacyNoApplication);
}

/** Submitted / in-review applications that are not yet enrolled collabs. */
export function isPendingCollabActivity(
  application: {
    status?: string | null;
    campaignId?: unknown;
    campaign?: { id?: unknown } | null;
  } | null,
  participation?: {
    status?: string | null;
    influencer_signature?: string | null;
  } | null
): boolean {
  const st = normParticipationStatus(application?.status);
  if (!st || st === 'rejected') return false;
  return !isParticipationEnrolled(participation, application?.status);
}
