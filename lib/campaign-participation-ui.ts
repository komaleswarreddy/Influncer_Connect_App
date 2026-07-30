/** Participation + application helpers for contract / mine-campaign UI. */

export function normParticipationStatus(status?: string | null): string {
  return String(status ?? '')
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
