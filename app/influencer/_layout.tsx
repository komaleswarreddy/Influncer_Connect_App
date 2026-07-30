import { Stack, Redirect, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { useAppShell } from '@/theme/useAppShell';

export default function InfluencerLayout() {
  const shell = useAppShell();
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const { isAuthenticated, isInitialized, refreshSession, nextStep } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    void hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    if (isAuthenticated && isInitialized) {
      // Soft refresh — don't kick to login if /me fails briefly while editing UI.
      void refreshSession({ logoutOnUnauthorized: false });
    }
  }, [isAuthenticated, isInitialized, refreshSession]);

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const onUsernameScreen = segments.includes('set-username');
  if (nextStep === 'SET_USERNAME' && !onUsernameScreen) {
    return <Redirect href="/influencer/set-username" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: shell.canvas },
        headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: shell.textPrimary },
        headerTintColor: shell.cta,
        contentStyle: { backgroundColor: shell.canvas },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="set-username" options={{ headerShown: false }} />
      <Stack.Screen
        name="contract"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="campaign-progress"
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen name="ugc-brief-detail" options={{ title: 'UGC Brief' }} />
      <Stack.Screen name="ugc-deliver" options={{ title: 'Deliver' }} />
      <Stack.Screen name="booking-deliver" options={{ title: 'Deliver' }} />
      <Stack.Screen name="rating-cards" options={{ title: 'Campaign Ratings' }} />
    </Stack>
  );
}
