import { Stack } from 'expo-router';
import { appShell } from '@/theme';

/**
 * Account flows (media kit, calculator, support, settings) — human titles only, no raw route paths.
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
      <Stack.Screen name="media-kit" options={{ title: 'Media Kit' }} />
      <Stack.Screen name="rate-calculator" options={{ title: 'Rate Calculator' }} />
      <Stack.Screen name="support-hub" options={{ title: 'Support' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
