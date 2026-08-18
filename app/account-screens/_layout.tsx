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
      <Stack.Screen name="support-hub" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="trending-ideas" />
      <Stack.Screen name="affiliate-links" />
      <Stack.Screen name="ugc-earnings" />
      <Stack.Screen name="ai-caption-results" />
    </Stack>
  );
}
