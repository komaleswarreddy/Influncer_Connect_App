import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { enterApp } from '@/lib/enter-app';
import { useAuthStore, getInfluencerEntryPath } from '@/store/auth-store';
import { tryCompletePendingCognitoAuth } from '@/lib/cognito-auth';
import { useKollab } from '@/theme/kollab-tokens';
import { showKollabToast } from '@/components/ui';

/**
 * Absorbs Cognito Hosted UI return: affiliateplatform://auth/callback?...
 *
 * Without this file, Expo Router treats the deep link as unmatched and briefly
 * shows +not-found ("This screen does not exist") while token exchange finishes.
 *
 * Two ways this screen can end up authenticated:
 *  1. CognitoAuthButtons's own in-process promise resolves and calls
 *     exchangeCognitoIdToken itself (isLoading below reflects that).
 *  2. Cold start: the app process was killed while the Hosted UI was open, so
 *     nobody's left to finish that promise. This screen then completes the
 *     exchange itself via tryCompletePendingCognitoAuth (below), using the
 *     PKCE verifier persisted right before the browser was opened.
 */
export default function CognitoAuthCallbackScreen() {
  const kollab = useKollab();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoading = useAuthStore((s) => s.isLoading);
  const nextStep = useAuthStore((s) => s.nextStep);
  const exchangeCognitoIdToken = useAuthStore((s) => s.exchangeCognitoIdToken);
  const navigated = useRef(false);
  const triedColdStart = useRef(false);

  useEffect(() => {
    if (isAuthenticated || isLoading || triedColdStart.current) return;
    triedColdStart.current = true;

    let cancelled = false;
    void (async () => {
      try {
        const result = await tryCompletePendingCognitoAuth();
        if (!result || cancelled) return;
        await exchangeCognitoIdToken(result.idToken);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Sign-in failed';
        if (__DEV__) console.warn('[auth/callback] cold-start token exchange failed:', msg);
        showKollabToast(msg);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, exchangeCognitoIdToken]);

  useEffect(() => {
    if (!isInitialized || navigated.current) return;

    if (isAuthenticated) {
      navigated.current = true;
      enterApp(router, getInfluencerEntryPath(nextStep));
      return;
    }

    // CognitoAuthButtons — or the cold-start recovery above — is exchanging
    // the ID token. Stay on this quiet screen.
    if (isLoading) return;

    // Exchange finished elsewhere without auth, or there was truly nothing to
    // recover (no code, or no pending verifier): leave, with a brief notice
    // instead of bouncing silently.
    const t = setTimeout(() => {
      if (navigated.current) return;
      const state = useAuthStore.getState();
      if (state.isAuthenticated) {
        navigated.current = true;
        enterApp(router, getInfluencerEntryPath(state.nextStep));
        return;
      }
      if (!state.isLoading) {
        navigated.current = true;
        showKollabToast('Please try signing in again.');
        router.replace('/login' as never);
      }
    }, 12000);

    return () => clearTimeout(t);
  }, [isAuthenticated, isInitialized, isLoading, nextStep, router]);

  return (
    <View
      style={[styles.container, { backgroundColor: kollab.color.screen }]}
      accessibilityLabel="Signing in"
    >
      <ActivityIndicator size="large" color={kollab.color.ink} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
