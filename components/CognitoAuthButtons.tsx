import React, { useState } from 'react';
import { View, Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useAuthStore, getInfluencerEntryPath } from '../store/auth-store';
import { signInWithCognito, CognitoCancelledError } from '../lib/cognito-auth';
import { useKollab } from '@/theme/kollab-tokens';
import { showKollabToast } from '@/components/ui';

type Props = {
  mode: 'login' | 'register';
  /** lime Google pill (HTML login) vs ink Google pill on white sheets. */
  variant?: 'lime' | 'ink';
};

function GoogleMark() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z"
        fill="#4285F4"
      />
      <Path
        d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"
        fill="#34A853"
      />
      <Path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6z" fill="#FBBC05" />
      <Path
        d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export function CognitoAuthButtons({ mode, variant = 'lime' }: Props) {
  const router = useRouter();
  const kollab = useKollab();
  const exchangeCognitoIdToken = useAuthStore((s) => s.exchangeCognitoIdToken);
  const [busy, setBusy] = useState(false);
  const label = mode === 'register' ? 'Continue with Google' : 'Continue with Google';

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
          <GoogleMark />
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
