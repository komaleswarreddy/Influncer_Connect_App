import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { pushApi } from './push-api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;
  if (Constants.appOwnership === 'expo') return null;

  await ensureAndroidChannel();
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  const token = tokenData.data;
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unknown';
  await pushApi.register(token, platform);
  return token;
}

export type PushDeepLinkData = {
  type?: string;
  notificationId?: string;
  campaignId?: string;
  inviteId?: string;
  bookingId?: string;
};

export function routeFromPushData(data: PushDeepLinkData): string | null {
  const type = String(data.type || '');
  if (type === 'campaign_invite') return '/influencer/invites';
  if (type === 'campaign_activated' || type === 'campaign_update') return '/influencer/(tabs)/campaigns';
  if (type.startsWith('rate_card_booking')) return '/account-screens/bookings';
  if (type.startsWith('ugc_')) return '/influencer/(tabs)/campaigns';
  if (type === 'payment_received') return '/account-screens/payments';
  return '/influencer/invites';
}
