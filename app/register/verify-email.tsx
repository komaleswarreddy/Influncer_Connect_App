import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore, getInfluencerEntryPath } from '../../store/auth-store';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabTextField,
  KollabButton,
  showKollabToast,
} from '@/components/ui';
import { useKollab, font, space } from '@/theme/kollab-tokens';
import { isValidOtpCode } from '@/lib/email-validation';

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Step 2 of email-first signup (app/register/influencer.tsx). The code here comes
 * from Cognito's own SignUp/ConfirmSignUp email — a different, one-time-per-signup
 * mechanism from the repeatable login OTP (app/login-email-otp.tsx), which is ours,
 * sent via SMTP (see server/services/email-otp.service.ts). If the account didn't
 * need a code at all (needsCode=0 — rare), this auto-completes on mount.
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const { confirmEmailSignup, resendEmailSignupCode, isLoading } = useAuthStore();
  const { email, needsCode, destination, ticket } = useLocalSearchParams<{
    email: string;
    needsCode?: string;
    destination?: string;
    ticket?: string;
  }>();

  const emailStr = String(email ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [autoSubmitting, setAutoSubmitting] = useState(needsCode === '0');
  const [cooldown, setCooldown] = useState(0);
  const attemptedAutoSubmit = useRef(false);

  const complete = async (submittedCode: string) => {
    setError(null);
    try {
      await confirmEmailSignup(emailStr, submittedCode);
      const step = useAuthStore.getState().nextStep;
      router.replace(getInfluencerEntryPath(step));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not confirm sign-up.');
      setAutoSubmitting(false);
    }
  };

  useEffect(() => {
    if (needsCode === '0' && !attemptedAutoSubmit.current) {
      attemptedAutoSubmit.current = true;
      void complete(String(ticket ?? ''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onResend = async () => {
    if (cooldown > 0) return;
    try {
      await resendEmailSignupCode(emailStr);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      showKollabToast('Code resent.');
    } catch (e: unknown) {
      showKollabToast(e instanceof Error ? e.message : 'Could not resend code.');
    }
  };

  const onConfirm = async () => {
    if (!isValidOtpCode(code)) {
      setError('Enter the 6-digit code.');
      return;
    }
    await complete(code);
  };

  if (autoSubmitting) {
    return (
      <ScrollScreen canvasColor={kollab.color.screen} padH={space.gutter}>
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={kollab.color.violetDeep} size="large" />
          <Text style={[styles.loadingText, { color: kollab.color.ink }]}>Finishing sign-up…</Text>
        </View>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen canvasColor={kollab.color.screen} padH={space.gutter}>
      <KollabScreenHeader
        title="Verify your email"
        subtitle={
          destination
            ? `Enter the code sent to ${destination}`
            : `Enter the code sent to ${emailStr}`
        }
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
        label={isLoading ? 'Confirming…' : 'Confirm'}
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
  loadingBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 120,
  },
  loadingText: { fontFamily: font.body, fontSize: 14 },
});
