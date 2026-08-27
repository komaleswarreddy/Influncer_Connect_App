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
import { isValidOtpCode, isValidUsername } from '@/lib/phone-number';

const RESEND_COOLDOWN_SECONDS = 30;
const USERNAME_TAKEN_MARKER = 'already taken';

/**
 * Step 2 of phone-first signup (app/register/influencer.tsx). If the account
 * didn't need a code at all (needsCode=0 — rare, only if the pool auto-confirmed
 * the account), this auto-completes sign-in on mount with no user action needed.
 */
export default function VerifyPhoneScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const { confirmPhoneSignup, resendPhoneSignupCode, isLoading } = useAuthStore();
  const { phoneNumber, username, needsCode, destination } = useLocalSearchParams<{
    phoneNumber: string;
    username: string;
    needsCode?: string;
    destination?: string;
  }>();

  const phone = String(phoneNumber ?? '');
  const originalUsername = String(username ?? '');

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [autoSubmitting, setAutoSubmitting] = useState(needsCode === '0');
  const [cooldown, setCooldown] = useState(0);
  const attemptedAutoSubmit = useRef(false);
  // A username conflict only ever surfaces *after* Cognito itself already accepted
  // the code (see phone-auth.service.ts) — once true, retries send a new username
  // with an empty code instead of resending a code that no longer exists.
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [retryUsername, setRetryUsername] = useState(originalUsername);

  const complete = async (submittedCode: string, usernameForThisAttempt: string) => {
    setError(null);
    try {
      await confirmPhoneSignup(phone, usernameForThisAttempt, submittedCode);
      const step = useAuthStore.getState().nextStep;
      router.replace(getInfluencerEntryPath(step));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not confirm sign-up.';
      setUsernameTaken(message.toLowerCase().includes(USERNAME_TAKEN_MARKER));
      setError(message);
      setAutoSubmitting(false);
    }
  };

  useEffect(() => {
    if (needsCode === '0' && !attemptedAutoSubmit.current) {
      attemptedAutoSubmit.current = true;
      void complete('', originalUsername);
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
      await resendPhoneSignupCode(phone);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      showKollabToast('Code resent.');
    } catch (e: unknown) {
      showKollabToast(e instanceof Error ? e.message : 'Could not resend code.');
    }
  };

  const onConfirm = async () => {
    if (usernameTaken) {
      if (!isValidUsername(retryUsername)) {
        setError('Username must be 3-30 characters: letters, numbers, spaces, or underscores.');
        return;
      }
      // The phone number was already confirmed with Cognito on the prior attempt —
      // an empty code tells the server to skip straight to provisioning.
      await complete('', retryUsername);
      return;
    }
    if (!isValidOtpCode(code)) {
      setError('Enter the 6-digit code.');
      return;
    }
    await complete(code, originalUsername);
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
        title={usernameTaken ? 'Choose another username' : 'Verify your phone'}
        subtitle={
          usernameTaken
            ? 'That username is already taken — pick another to finish signing up.'
            : destination
              ? `Enter the code sent to ${destination}`
              : `Enter the code sent to ${phone}`
        }
        backTone="well"
        onBack={() => router.back()}
      />

      <View style={{ gap: 10, marginBottom: 16 }}>
        {usernameTaken ? (
          <KollabTextField
            placeholder="Choose a username"
            value={retryUsername}
            onChangeText={setRetryUsername}
            autoCapitalize="none"
            surface="well"
          />
        ) : (
          <KollabTextField
            placeholder="6-digit code"
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            surface="well"
          />
        )}
      </View>

      <KollabButton
        label={isLoading ? 'Confirming…' : usernameTaken ? 'Try this username' : 'Confirm'}
        onPress={onConfirm}
        disabled={isLoading}
      />
      {error ? <Text style={[styles.err, { color: kollab.color.heat }]}>{error}</Text> : null}

      {!usernameTaken ? (
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
      ) : null}
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
