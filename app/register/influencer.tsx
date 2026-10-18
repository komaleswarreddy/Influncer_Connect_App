import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabTextField,
  KollabButton,
  showKollabToast,
} from '@/components/ui';
import { useKollab, font, space } from '@/theme/kollab-tokens';
import { isValidEmail, normalizeEmail } from '@/lib/email-validation';
import {
  looksLikeReferralCode,
  normalizeReferralInput,
  setPendingReferral,
} from '@/lib/pending-referral';

/**
 * Email-first signup — the primary way to create a new influencer account on mobile.
 * (Phone-first signup — app/register/verify-phone.tsx — is still in the codebase but
 * not linked from here: SMS delivery on the shared Cognito pool is currently blocked
 * by AWS SNS sandbox + India DLT registration, both outside this app's control. Email
 * has neither blocker.) Sends a one-time confirmation code to the entered email, then
 * hands off to app/register/verify-email.tsx to confirm it.
 */
export default function InfluencerRegisterScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const { startEmailSignup, isLoading, error } = useAuthStore();
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // A shared invite link opens this screen with ?ref=CODE: pre-fill it and remember it in case the creator leaves and returns.
  useEffect(() => {
    if (typeof ref === 'string' && looksLikeReferralCode(ref)) {
      const code = normalizeReferralInput(ref);
      setReferralCode(code);
      void setPendingReferral(code);
    }
  }, [ref]);

  const onContinue = async () => {
    setFormError(null);
    if (!isValidEmail(email)) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (!agreedToTerms) {
      showKollabToast('You must agree to the terms and conditions');
      return;
    }
    if (referralCode.trim() && !looksLikeReferralCode(referralCode)) {
      setFormError('A referral code is 6 letters or numbers. Clear the field to skip it.');
      return;
    }
    const normalized = normalizeEmail(email);
    try {
      // Saved now, applied automatically after the new account signs in.
      if (referralCode.trim()) await setPendingReferral(referralCode);
      const res = await startEmailSignup(normalized);
      router.push({
        pathname: '/register/verify-email',
        params: {
          email: normalized,
          needsCode: res.needsCode ? '1' : '0',
          destination: res.destination || '',
        },
      });
    } catch (e: unknown) {
      showKollabToast(e instanceof Error ? e.message : 'Please try again.');
    }
  };

  return (
    <ScrollScreen canvasColor={kollab.color.screen} padH={space.gutter}>
      <KollabScreenHeader
        title="Join as influencer"
        subtitle="Create your creator account with just your email"
        backTone="well"
        onBack={() => router.back()}
      />

      <View style={{ gap: 10, marginBottom: 16 }}>
        <KollabTextField
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          surface="well"
        />
        <KollabTextField
          placeholder="Referral code (optional)"
          value={referralCode}
          onChangeText={(v) => setReferralCode(v.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={12}
          surface="well"
        />
      </View>

      <Pressable
        onPress={() => setAgreedToTerms((v) => !v)}
        style={styles.termsRow}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreedToTerms }}
      >
        <View
          style={[
            styles.check,
            {
              borderColor: kollab.color.outline,
              backgroundColor: agreedToTerms ? kollab.color.chartreuse : 'transparent',
            },
          ]}
        >
          {agreedToTerms ? (
            <Text style={{ color: kollab.color.onChartreuse, fontSize: 13 }}>✓</Text>
          ) : null}
        </View>
        <Text style={[styles.termsLabel, { color: kollab.color.ink }]}>
          I agree to the terms and conditions
        </Text>
      </Pressable>

      <KollabButton
        label={isLoading ? 'Sending code…' : 'Send code'}
        onPress={onContinue}
        disabled={isLoading}
      />
      {formError || error ? (
        <Text style={[styles.err, { color: kollab.color.heat }]}>{formError || error}</Text>
      ) : null}

      <Pressable onPress={() => router.push('/login')} style={styles.signIn}>
        <Text style={[styles.signInText, { color: kollab.color.violetDeep }]}>
          Already have an account? Sign in
        </Text>
      </Pressable>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsLabel: { fontFamily: font.semiBold, fontSize: 13, flex: 1 },
  err: { fontFamily: font.body, fontSize: 13, marginTop: 8, textAlign: 'center' },
  signIn: { marginTop: 12, paddingVertical: 8, alignItems: 'center' },
  signInText: { fontFamily: font.semiBold, fontSize: 13.5 },
});
