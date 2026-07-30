import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore, getInfluencerEntryPath } from '@/store/auth-store';
import { appShell } from '@/theme';

/**
 * Absorbs Cognito Hosted UI return: affiliateplatform://auth/callback?...
 *
 * Without this file, Expo Router treats the deep link as unmatched and briefly
 * shows +not-found ("This screen does not exist") while token exchange finishes.
 */
export default function CognitoAuthCallbackScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoading = useAuthStore((s) => s.isLoading);
  const nextStep = useAuthStore((s) => s.nextStep);
  const navigated = useRef(false);

  useEffect(() => {
    if (!isInitialized || navigated.current) return;

    if (isAuthenticated) {
      navigated.current = true;
      router.replace(getInfluencerEntryPath(nextStep) as never);
      return;
    }

    // CognitoAuthButtons is exchanging the ID token — stay on this quiet screen.
    if (isLoading) return;

    // Exchange finished elsewhere without auth, or deep link opened cold: leave quietly.
    const t = setTimeout(() => {
      if (navigated.current) return;
      const state = useAuthStore.getState();
      if (state.isAuthenticated) {
        navigated.current = true;
        router.replace(getInfluencerEntryPath(state.nextStep) as never);
        return;
      }
      if (!state.isLoading) {
        navigated.current = true;
        router.replace('/login' as never);
      }
    }, 12000);

    return () => clearTimeout(t);
  }, [isAuthenticated, isInitialized, isLoading, nextStep, router]);

  return (
    <View style={styles.container} accessibilityLabel="Signing in">
      <ActivityIndicator size="large" color={appShell.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appShell.canvas,
  },
});
