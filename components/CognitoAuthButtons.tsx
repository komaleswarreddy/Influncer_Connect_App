import React, { useState } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useAuthStore, getInfluencerEntryPath } from '../store/auth-store';
import { signInWithCognito, CognitoCancelledError } from '../lib/cognito-auth';
import { useKollab } from '@/theme/kollab-tokens';
import { showKollabToast } from '@/components/ui';

type Props = {
  mode: 'login' | 'register';
  /** lime pill (HTML login) vs ink pill on white sheets. */
  variant?: 'lime' | 'ink';
};

/** Simple lock glyph — this pool has no real Google federation configured
 *  (SupportedIdentityProviders is COGNITO only), so no Google mark here. */
function LockMark({ color }: { color: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 11V8a6 6 0 1 1 12 0v3M5 11h14a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a1 1 0 0 1 1-1Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CognitoAuthButtons({ mode, variant = 'lime' }: Props) {
  const router = useRouter();
  const kollab = useKollab();
  const exchangeCognitoIdToken = useAuthStore((s) => s.exchangeCognitoIdToken);
  const [busy, setBusy] = useState(false);
  const label = mode === 'register' ? 'Sign up with password' : 'Sign in with password';

  const runCognitoFlow = async () => {
    setBusy(true);
    try {
      const { idToken } = await signInWithCognito();
      await exchangeCognitoIdToken(idToken);
      const step = useAuthStore.getState().nextStep;
      router.replace(getInfluencerEntryPath(step));
    } catch (e: unknown) {
      // Genuine user cancellation stays silent; everything else (including a
      // timed-out browser session) shows real feedback instead of nothing.
      if (e instanceof CognitoCancelledError) return;
      const msg = e instanceof Error ? e.message : 'Sign-in failed';
      showKollabToast(msg);
    } finally {
      setBusy(false);
    }
  };

  const bg = variant === 'lime' ? kollab.color.chartreuse : kollab.color.ink;
  const fg = variant === 'lime' ? kollab.color.onChartreuse : kollab.color.chartreuse;

  return (
    <Pressable
      onPress={runCognitoFlow}
      disabled={busy}
      style={[styles.btn, { backgroundColor: bg, opacity: busy ? 0.7 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {busy ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          <LockMark color={fg} />
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    borderRadius: 999,
    paddingVertical: 18,
    width: '100%',
  },
  label: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 16,
  },
});
