import { useMemo } from 'react';
import { Stack } from 'expo-router';
import { useKollab } from '@/theme';

export default function AccountScreensLayout() {
  const kollab = useKollab();

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: kollab.color.screen },
      animation: 'slide_from_right' as const,
    }),
    [kollab.color.screen]
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="rate-calculator" />
      <Stack.Screen name="rate-card" />
      <Stack.Screen name="instagram-hub" />
      <Stack.Screen name="whatsapp-hub" />
      <Stack.Screen name="whatsapp-conversation" />
      <Stack.Screen name="schedule-content" />
      <Stack.Screen name="create-scheduled-post" />
      <Stack.Screen name="scheduled-calendar" />
      <Stack.Screen name="dm-automation" />
      <Stack.Screen name="create-automation" />
      <Stack.Screen name="automation-detail" />
      <Stack.Screen name="catalog" />
      <Stack.Screen name="catalog-setup" />
      <Stack.Screen name="catalog-builder" />
      <Stack.Screen name="catalog-preview" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="invoices" />
      <Stack.Screen name="invoice-detail" />
      <Stack.Screen name="invoice-edit" />
      <Stack.Screen name="referrals" />
      <Stack.Screen name="brand-kit" />
      <Stack.Screen name="leads" />
      <Stack.Screen name="lead-detail" />
      <Stack.Screen name="lead-form" />
      <Stack.Screen name="aira" />
      <Stack.Screen name="aira-history" />
      <Stack.Screen name="events" />
      <Stack.Screen name="event-form" />
      <Stack.Screen name="event-passes" />
      <Stack.Screen name="event-detail" />
      <Stack.Screen name="event-attendees" />
      <Stack.Screen name="event-scanner" />
      <Stack.Screen name="meets" />
      <Stack.Screen name="meet-form" />
      <Stack.Screen name="meet-bookings" />
      <Stack.Screen name="meet-booking-detail" />
      <Stack.Screen name="support-hub" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="trending-ideas" />
      <Stack.Screen name="affiliate-links" />
      <Stack.Screen name="ugc-earnings" />
      <Stack.Screen name="ai-caption-results" />
    </Stack>
  );
}
