import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { enterApp } from '@/lib/enter-app';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore, getInfluencerEntryPath } from '../store/auth-store';
import { useMockAuth, cognitoConfigured } from '../lib/auth-config';
import { useKollab, asset, scrimStops, font } from '@/theme/kollab-tokens';
import { KollabTextField } from '@/components/ui/KollabTextField';
import { KollabButton } from '@/components/ui/KollabButton';
import { showKollabToast } from '@/components/ui';
import { isValidEmail, normalizeEmail } from '@/lib/email-validation';

/**
 * Email + OTP is the only sign-in path surfaced here — it's the fully working,
 * production-ready flow (see server/services/email-otp.service.ts). Hosted-UI
 * password sign-in (components/CognitoAuthButtons.tsx) still exists in the codebase
 * for any pre-existing accounts, just not linked from this screen for now.
 */
export default function LoginScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const { login, startEmailLogin, error: authError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [otpEmail, setOtpEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpNotRegistered, setOtpNotRegistered] = useState(false);

  const onMockSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const step = useAuthStore.getState().nextStep;
      enterApp(router, getInfluencerEntryPath(step));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const onEmailChange = (v: string) => {
    setOtpEmail(v);
    setOtpError(null);
    setOtpNotRegistered(false);
  };

  const onSendEmailCode = async () => {
    setOtpError(null);
    setOtpNotRegistered(false);
    if (!isValidEmail(otpEmail)) {
      setOtpError('Enter a valid email address.');
      return;
    }
    const normalized = normalizeEmail(otpEmail);
    setOtpLoading(true);
    try {
      await startEmailLogin(normalized);
      router.push({ pathname: '/login-email-otp', params: { email: normalized } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not send code.';
      // Matches the server's exact message (server/services/email-otp.service.ts) —
      // offer a direct path to sign up instead of just showing a dead-end error.
      if (/no account found/i.test(message)) {
        setOtpNotRegistered(true);
      } else {
        setOtpError(message);
        showKollabToast(message);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Image
        source={asset.onboardingHero}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
      />
      <LinearGradient
        colors={scrimStops.fullBleed.colors as [string, string, string, string]}
        locations={scrimStops.fullBleed.locations as [number, number, number, number]}
        style={StyleSheet.absoluteFillObject}
      />
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <View style={styles.topRow}>
            <Text style={styles.brand} numberOfLines={1} adjustsFontSizeToFit>
              Influencer{' '}
              <Text style={[styles.brandEm, { color: kollab.color.chartreuse }]}>Connect</Text>
            </Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>for creators</Text>
            </View>
          </View>
          <View style={styles.flex} />
          <Text style={styles.welcome}>
            Welcome <Text style={[styles.welcomeEm, { color: kollab.color.chartreuse }]}>back</Text>
            .
          </Text>
          <Text style={styles.sub}>Enter your email and we&apos;ll send you a sign-in code.</Text>

          <View style={styles.formBlock}>
            <KollabTextField
              placeholder="Email"
              value={otpEmail}
              onChangeText={onEmailChange}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              surface="well"
            />
            {otpError ? (
              <Text style={[styles.err, { color: kollab.color.chartreuse }]}>{otpError}</Text>
            ) : null}

            {otpNotRegistered ? (
              <>
                <Text style={[styles.err, { color: kollab.color.chartreuse }]}>
                  No account found for this email.
                </Text>
                <Pressable
                  onPress={() => router.push('/register/influencer')}
                  style={[styles.primaryBtn, { backgroundColor: kollab.color.chartreuse }]}
                  accessibilityRole="button"
                  accessibilityLabel="Create account"
                >
                  <Text style={[styles.primaryBtnLabel, { color: kollab.color.onChartreuse }]}>
                    Create account
                  </Text>
                </Pressable>
              </>
            ) : (
              <KollabButton
                label={otpLoading ? 'Sending code…' : 'Send code'}
                onPress={onSendEmailCode}
                disabled={otpLoading}
                icon={
                  otpLoading ? <ActivityIndicator color={kollab.color.onChartreuse} /> : undefined
                }
              />
            )}
          </View>

          {useMockAuth && !cognitoConfigured ? (
            <View style={styles.formBlock}>
              <Text style={styles.devLabel}>Dev/testing (mock auth)</Text>
              <KollabTextField
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                surface="well"
              />
              <KollabTextField
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                surface="well"
              />
              {error || authError ? (
                <Text style={[styles.err, { color: kollab.color.chartreuse }]}>
                  {error ?? authError}
                </Text>
              ) : null}
              <KollabButton
                label={loading ? 'Signing in…' : 'Sign in'}
                onPress={onMockSignIn}
                disabled={loading}
                icon={loading ? <ActivityIndicator color={kollab.color.onChartreuse} /> : undefined}
              />
            </View>
          ) : null}

          <Pressable
            onPress={() => router.push('/register/influencer')}
            style={styles.footerRow}
            accessibilityRole="button"
            accessibilityLabel="Create new account"
          >
            <Text style={styles.footerText}>
              Don&apos;t have an account?{' '}
              <Text style={[styles.footerLink, { color: kollab.color.chartreuse }]}>
                Create one
              </Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0906' },
  flex1: { flex: 1 },
  inner: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  brand: {
    flexShrink: 1,
    fontFamily: font.display,
    fontSize: 17,
    letterSpacing: -0.3,
    color: '#FFFFFF',
  },
  brandEm: {
    fontFamily: font.displayItalic,
  },
  chip: {
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  chipText: {
    fontFamily: font.bold,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#FFFFFF',
  },
  flex: { flex: 1 },
  welcome: {
    fontFamily: font.display,
    fontSize: 46,
    lineHeight: 47,
    letterSpacing: -1.5,
    color: '#FFFFFF',
  },
  welcomeEm: {
    fontFamily: font.displayItalic,
  },
  sub: {
    fontFamily: font.body,
    fontSize: 14.5,
    lineHeight: 22,
    opacity: 0.85,
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 26,
    maxWidth: 320,
  },
  formBlock: {
    gap: 10,
  },
  devLabel: {
    fontFamily: font.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    opacity: 0.5,
    marginBottom: 2,
  },
  primaryBtn: {
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryBtnLabel: {
    fontFamily: font.semiBold,
    fontSize: 16,
  },
  err: {
    fontFamily: font.body,
    fontSize: 13,
  },
  footerRow: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 22,
  },
  footerText: {
    fontFamily: font.body,
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  footerLink: {
    fontFamily: font.semiBold,
  },
});
