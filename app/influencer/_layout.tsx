import { Stack, Redirect, useSegments } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { useKollab } from '@/theme/kollab-tokens';
import { usePendingReferralApply } from '@/hooks/usePendingReferralApply';

export default function InfluencerLayout() {
  const kollab = useKollab();
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

  // A referral code typed at signup is applied once the new creator is signed in.
  usePendingReferralApply(isAuthenticated && isInitialized);

  // Hooks must run before the early returns below (Rules of Hooks), even
  // though screenOptions is only used once we reach the final <Stack>.
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: kollab.color.screen },
      animation: 'slide_from_right' as const,
    }),
    [kollab.color.screen]
  );

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const onUsernameScreen = (segments as string[]).includes('set-username');
  if (nextStep === 'SET_USERNAME' && !onUsernameScreen) {
    return <Redirect href="/influencer/set-username" />;
  }

  return (
    <Stack screenOptions={screenOptions}>
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
      <Stack.Screen name="ugc-brief-detail" />
      <Stack.Screen name="ugc-deliver" />
      <Stack.Screen name="booking-deliver" />
      <Stack.Screen name="rating-cards" />
      <Stack.Screen name="inbox" />
    </Stack>
  );
}
