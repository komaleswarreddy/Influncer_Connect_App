import { Stack } from 'expo-router';
import { appShell } from '@/theme';

/**
 * Account flows (calculator, support, settings) — human titles only, no raw route paths.
 */
export default function AccountScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: appShell.canvas },
        headerTitleStyle: {
          fontFamily: 'Inter_700Bold',
          fontSize: 18,
          color: appShell.textPrimary,
        },
        headerTintColor: appShell.cta,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: appShell.canvas },
      }}
    >
      <Stack.Screen name="rate-calculator" options={{ title: 'Rate Calculator' }} />
      <Stack.Screen name="rate-card" options={{ title: 'Rate Card' }} />
      <Stack.Screen name="instagram-hub" options={{ title: 'Instagram' }} />
      <Stack.Screen name="schedule-content" options={{ title: 'Schedule Content' }} />
      <Stack.Screen name="create-scheduled-post" options={{ title: 'Schedule post' }} />
      <Stack.Screen name="scheduled-calendar" options={{ title: 'Calendar' }} />
      <Stack.Screen name="dm-automation" options={{ title: 'DM Automation' }} />
      <Stack.Screen name="create-automation" options={{ title: 'Create automation' }} />
      <Stack.Screen name="automation-detail" options={{ title: 'Automation' }} />
      <Stack.Screen name="catalog" options={{ title: 'Catalog' }} />
      <Stack.Screen name="catalog-setup" options={{ title: 'Set up catalog' }} />
      <Stack.Screen name="catalog-builder" options={{ title: 'Build catalog' }} />
      <Stack.Screen name="catalog-preview" options={{ title: 'Preview' }} />
      <Stack.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Stack.Screen name="payments" options={{ title: 'Payments' }} />
      <Stack.Screen name="support-hub" options={{ title: 'Support' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="trending-ideas" options={{ title: 'Trending ideas' }} />
      <Stack.Screen name="affiliate-links" options={{ title: 'Affiliate links' }} />
      <Stack.Screen name="ugc-earnings" options={{ title: 'UGC earnings' }} />
      <Stack.Screen name="ai-caption-results" options={{ title: 'AI captions' }} />
    </Stack>
  );
}
