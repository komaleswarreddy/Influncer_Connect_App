/**
 * Push helpers.
 *
 * IMPORTANT: Do NOT import `expo-notifications` from this module.
 * Loading that package in Expo Go (SDK 53+) runs DevicePushTokenAutoRegistration.fx,
 * which calls addPushTokenListener → console.error LogBox on Android.
 *
 * Real push registration belongs in a development/production build only.
 * Wire it back behind a dedicated entry that never loads in Expo Go.
 */

export function isExpoGo(): boolean {
  // Kept for callers; push is disabled for all runtimes from app root.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isRunningInExpoGo } = require('expo') as { isRunningInExpoGo: () => boolean };
    return isRunningInExpoGo();
  } catch {
    return true;
  }
}

/** Always no-op — Expo Go must never touch expo-notifications. */
export async function registerForPushNotifications(): Promise<string | null> {
  return null;
}

export async function ensureAndroidChannel(): Promise<void> {
  return;
}

export type PushDeepLinkData = {
  type?: string;
  notificationId?: string;
  campaignId?: string;
  inviteId?: string;
  bookingId?: string;
  participationId?: string;
  status?: string;
  title?: string;
};

export function routeFromPushData(data: PushDeepLinkData): string | null {
  const type = String(data.type || '');
  const title = String(data.title || '').toLowerCase();
  const approved =
    data.status === 'approved' || title.includes('approv') || type.toLowerCase().includes('approv');

  if (type === 'campaign_invite') return '/influencer/inbox';
  if (approved && data.participationId) {
    return `/influencer/contract?participationId=${encodeURIComponent(data.participationId)}`;
  }
  if (type === 'campaign_activated' || type === 'campaign_update') {
    return data.campaignId
      ? `/influencer/campaigns?campaignId=${encodeURIComponent(data.campaignId)}`
      : '/influencer/(tabs)/campaigns';
  }
  if (type === 'invite_accepted' || type === 'invite_declined' || type === 'invite_expired') {
    return '/influencer/(tabs)/campaigns';
  }
  if (type === 'rate_card_deliverable_submitted' || type.startsWith('rate_card_booking')) {
    return data.bookingId
      ? `/account-screens/bookings?bookingId=${encodeURIComponent(data.bookingId)}`
      : '/account-screens/bookings';
  }
  if (type.startsWith('ugc_')) {
    return data.campaignId
      ? `/influencer/campaigns?campaignId=${encodeURIComponent(data.campaignId)}`
      : '/influencer/(tabs)/campaigns';
  }
  if (type === 'payment_received') return '/account-screens/payments';
  return '/influencer/inbox';
}

/** Always no-op — no notification listeners in Expo Go / current app entry. */
export function subscribeToNotificationResponses(
  _onResponse: (data: Record<string, unknown>) => void
): () => void {
  return () => undefined;
}
