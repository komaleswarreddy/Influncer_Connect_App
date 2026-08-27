import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore, getInfluencerEntryPath } from '../store/auth-store';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabTextField,
  KollabButton,
  showKollabToast,
} from '@/components/ui';
import { useKollab, font, space } from '@/theme/kollab-tokens';
import { isValidOtpCode } from '@/lib/phone-number';

const RESEND_COOLDOWN_SECONDS = 30;

/** SMS OTP login step 2 — reached from app/login.tsx's "Log in with phone number" flow. */
export default function LoginOtpScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const { verifyPhoneLogin, startPhoneLogin, isLoading } = useAuthStore();
  const { phoneNumber, session: initialSession } = useLocalSearchParams<{
    phoneNumber: string;
    session: string;
  }>();

  const phone = String(phoneNumber ?? '');
  const [session, setSession] = useState(String(initialSession ?? ''));
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onResend = async () => {
    if (cooldown > 0) return;
    try {
      const res = await startPhoneLogin(phone);
      setSession(res.session);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      showKollabToast('Code resent.');
    } catch (e: unknown) {
      showKollabToast(e instanceof Error ? e.message : 'Could not resend code.');
    }
  };

  const onConfirm = async () => {
    setError(null);
    if (!isValidOtpCode(code)) {
      setError('Enter the 6-digit code.');
      return;
    }
    try {
      await verifyPhoneLogin(phone, session, code);
      const step = useAuthStore.getState().nextStep;
      router.replace(getInfluencerEntryPath(step));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not sign you in.');
    }
  };

  return (
    <ScrollScreen canvasColor={kollab.color.screen} padH={space.gutter}>
      <KollabScreenHeader
        title="Enter code"
        subtitle={`Enter the code sent to ${phone}`}
        backTone="well"
        onBack={() => router.back()}
      />

      <View style={{ gap: 10, marginBottom: 16 }}>
        <KollabTextField
          placeholder="6-digit code"
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          surface="well"
        />
      </View>

      <KollabButton
        label={isLoading ? 'Signing in…' : 'Sign in'}
        onPress={onConfirm}
        disabled={isLoading}
      />
      {error ? <Text style={[styles.err, { color: kollab.color.heat }]}>{error}</Text> : null}

      <Pressable onPress={onResend} disabled={cooldown > 0} style={styles.resend}>
        <Text
          style={[
            styles.resendText,
            { color: kollab.color.violetDeep, opacity: cooldown > 0 ? 0.5 : 1 },
          ]}
        >
          {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
        </Text>
      </Pressable>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  err: { fontFamily: font.body, fontSize: 13, marginTop: 8, textAlign: 'center' },
  resend: { marginTop: 16, paddingVertical: 8, alignItems: 'center' },
  resendText: { fontFamily: font.semiBold, fontSize: 13.5 },
});
