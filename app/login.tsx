import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ScrollView,
  Text as RNText,
  ActivityIndicator,
  Text,
} from 'react-native';
import { TextInput, Button, Checkbox, Dialog, Portal } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, getInfluencerEntryPath } from '../store/auth-store';
import { CognitoAuthButtons } from '../components/CognitoAuthButtons';
import { LoginHeroLottie } from '../components/LoginHeroLottie';
import { cognitoConfigured, useMockAuth } from '../lib/auth-config';
import { getApiBaseUrl } from '../lib/api';
import { loginScreen, loginPremium, premiumButton } from '@/theme';

const PILL = 999;

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
  remember: z.boolean().optional(),
  tenant: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const inputThemeLight = {
  colors: {
    surface: loginScreen.background,
    onSurface: loginScreen.textPrimary,
    onSurfaceVariant: loginScreen.textSecondary,
    outline: loginScreen.inputOutline,
  },
};

export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const { login, error: authError } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false, tenant: '' },
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    if (!data.email || !data.password) {
      setError('Please enter both email and password');
      return;
    }
    if (data.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login(data.email, data.password);
      const step = useAuthStore.getState().nextStep;
      router.replace(getInfluencerEntryPath(step));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Login failed. Please check your credentials and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetMsg(null);
    setResetLoading(true);
    try {
      const base = getApiBaseUrl();
      if (!base) {
        setResetMsg('API URL is not configured.');
        return;
      }
      const res = await fetch(`${base}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      if (!res.ok) throw new Error('Failed to send password reset email.');
      setResetMsg('Password reset email sent! Check your inbox.');
    } catch (err: unknown) {
      setResetMsg(err instanceof Error ? err.message : 'Failed to send password reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <View style={styles.root}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.hero}>
                <RNText style={styles.eyebrow}>Affiliate Platform</RNText>
                <RNText style={styles.welcome}>Welcome back</RNText>
                <RNText style={styles.tagline}>Sign in to continue to your workspace</RNText>
                <LoginHeroLottie />
                <View style={styles.accentBar} />
              </View>

              <View style={styles.signInSection}>
                <View style={styles.signInInner}>
                  <RNText style={styles.signInTitle}>Sign in</RNText>
                  {useMockAuth ? (
                    <RNText style={styles.signInHint}>
                      {cognitoConfigured
                        ? 'Development: mock email sign-in below.'
                        : 'Enter your credentials to access your account'}
                    </RNText>
                  ) : null}

                  {cognitoConfigured ? (
                    <>
                      <View style={{ height: useMockAuth ? 20 : 12 }} />
                      <CognitoAuthButtons mode="login" appearance="premium" />
                      {useMockAuth ? (
                        <View style={styles.dividerRow}>
                          <View style={styles.divider} />
                          <RNText style={styles.dividerText}>Or mock sign-in</RNText>
                          <View style={styles.divider} />
                        </View>
                      ) : null}
                    </>
                  ) : null}

                  {useMockAuth ? (
                    <>
                      <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, value } }) => (
                          <TextInput
                            label="Email"
                            mode="outlined"
                            value={value}
                            onChangeText={onChange}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            error={!!errors.email}
                            style={styles.input}
                            disabled={loading}
                            placeholderTextColor={loginScreen.textSecondary}
                            theme={inputThemeLight}
                            outlineColor={loginScreen.inputOutline}
                            activeOutlineColor={loginScreen.inputOutlineActive}
                            textColor={loginScreen.textPrimary}
                          />
                        )}
                      />
                      {errors.email ? (
                        <RNText style={styles.fieldError}>{errors.email.message}</RNText>
                      ) : null}
                      <View style={{ height: 10 }} />
                      <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, value } }) => (
                          <TextInput
                            label="Password"
                            mode="outlined"
                            value={value}
                            onChangeText={onChange}
                            secureTextEntry={!showPassword}
                            right={
                              <TextInput.Icon
                                icon={showPassword ? 'eye-off' : 'eye'}
                                onPress={() => setShowPassword(!showPassword)}
                              />
                            }
                            error={!!errors.password}
                            style={styles.input}
                            disabled={loading}
                            placeholderTextColor={loginScreen.textSecondary}
                            theme={inputThemeLight}
                            outlineColor={loginScreen.inputOutline}
                            activeOutlineColor={loginScreen.inputOutlineActive}
                            textColor={loginScreen.textPrimary}
                          />
                        )}
                      />
                      {errors.password ? (
                        <RNText style={styles.fieldError}>{errors.password.message}</RNText>
                      ) : null}
                      <View style={styles.row}>
                        <Controller
                          control={control}
                          name="remember"
                          render={({ field: { onChange, value } }) => (
                            <View style={styles.checkboxRow}>
                              <Checkbox
                                status={value ? 'checked' : 'unchecked'}
                                onPress={() => onChange(!value)}
                                disabled={loading}
                                color={loginScreen.inputOutlineActive}
                              />
                              <RNText style={styles.checkboxLabel}>Remember me</RNText>
                            </View>
                          )}
                        />
                        <TouchableOpacity onPress={() => setForgotVisible(true)} disabled={loading}>
                          <RNText style={styles.forgot}>Forgot password?</RNText>
                        </TouchableOpacity>
                      </View>
                      {authError ? <RNText style={styles.fieldError}>{authError}</RNText> : null}
                      {error ? <RNText style={styles.fieldError}>{error}</RNText> : null}

                      <View style={styles.premiumBtnWrap}>
                        <View style={styles.premiumBtnShadow}>
                          <TouchableOpacity
                            activeOpacity={0.88}
                            onPress={handleSubmit(onSubmit)}
                            disabled={loading || !isValid}
                            style={[
                              styles.premiumBtnTouchable,
                              (loading || !isValid) && styles.premiumBtnDisabled,
                            ]}
                          >
                            <View style={styles.premiumBtnClip}>
                              <LinearGradient
                                colors={[...premiumButton.baseGradient]}
                                locations={[...premiumButton.baseLocations]}
                                start={{ x: 0.5, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                                style={StyleSheet.absoluteFillObject}
                              />
                              <LinearGradient
                                colors={[...premiumButton.glossGradient]}
                                locations={[...premiumButton.glossLocations]}
                                start={{ x: 0.5, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                                style={[
                                  styles.premiumBtnGloss,
                                  { height: premiumButton.glossHeightPercent },
                                ]}
                                pointerEvents="none"
                              />
                              <View style={styles.premiumBtnRim} pointerEvents="none" />
                              <View style={styles.premiumBtnContent}>
                                {loading ? (
                                  <ActivityIndicator
                                    color={premiumButton.labelColor}
                                    size="small"
                                  />
                                ) : (
                                  <RNText style={styles.premiumBtnLabel}>Sign in</RNText>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  ) : (
                    !cognitoConfigured && (
                      <RNText style={styles.configError}>
                        Set EXPO_PUBLIC_COGNITO_* in mobile/.env, or enable useMockAuth for local
                        testing.
                      </RNText>
                    )
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <RNText style={styles.footerText}>
                © {new Date().getFullYear()} Affiliate Platform. All rights reserved.
              </RNText>
              <View style={styles.footerLinks}>
                <TouchableOpacity onPress={() => Linking.openURL('https://your-terms-url.com')}>
                  <RNText style={styles.footerLink}>Terms</RNText>
                </TouchableOpacity>
                <RNText style={styles.footerDot}>·</RNText>
                <TouchableOpacity onPress={() => Linking.openURL('https://your-privacy-url.com')}>
                  <RNText style={styles.footerLink}>Privacy</RNText>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>

        <Portal>
          <Dialog
            visible={forgotVisible}
            onDismiss={() => setForgotVisible(false)}
            style={styles.dialog}
          >
            <Dialog.Title>Reset Password</Dialog.Title>
            <Dialog.Content>
              <Text style={{ color: loginScreen.textPrimary }}>
                Enter your email to receive password reset instructions.
              </Text>
              <TextInput
                label="Email"
                mode="outlined"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.inputDialog}
                disabled={resetLoading}
                placeholderTextColor={loginScreen.textSecondary}
                theme={inputThemeLight}
                outlineColor={loginScreen.inputOutline}
                activeOutlineColor={loginScreen.inputOutlineActive}
                textColor={loginScreen.textPrimary}
              />
              {resetMsg ? <Text style={{ color: loginPremium.error }}>{resetMsg}</Text> : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handlePasswordReset} loading={resetLoading} disabled={resetLoading}>
                Send Email
              </Button>
              <Button onPress={() => setForgotVisible(false)} disabled={resetLoading}>
                Cancel
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: loginScreen.background,
  },
  safe: {
    flex: 1,
    backgroundColor: loginScreen.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  hero: {
    marginBottom: 18,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.4,
    color: loginScreen.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcome: {
    fontSize: 30,
    fontWeight: '700',
    color: loginScreen.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    lineHeight: 22,
    color: loginScreen.textSecondary,
    fontWeight: '400',
    maxWidth: 320,
    textAlign: 'center',
  },
  accentBar: {
    alignSelf: 'center',
    marginTop: 14,
    width: 56,
    height: 3,
    borderRadius: 2,
    backgroundColor: loginScreen.accent,
  },
  signInSection: {
    width: '100%',
    alignItems: 'stretch',
    maxWidth: 400,
    alignSelf: 'center',
  },
  signInInner: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    width: '100%',
  },
  signInTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: loginScreen.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  signInHint: {
    marginTop: 8,
    fontSize: 13,
    color: loginScreen.textSecondary,
    lineHeight: 19,
    textAlign: 'center',
  },
  input: {
    marginBottom: 0,
    backgroundColor: loginScreen.background,
  },
  inputDialog: {
    marginTop: 8,
    marginBottom: 0,
    backgroundColor: loginScreen.background,
  },
  fieldError: {
    color: loginPremium.error,
    fontSize: 13,
    marginTop: 6,
  },
  configError: {
    marginTop: 12,
    color: loginPremium.error,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 4,
    fontSize: 14,
    color: loginScreen.textSecondary,
  },
  forgot: {
    color: loginScreen.inputOutlineActive,
    fontWeight: '600',
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: loginScreen.inputOutline,
  },
  dividerText: {
    marginHorizontal: 12,
    color: loginScreen.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  premiumBtnWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  premiumBtnShadow: {
    width: '100%',
    maxWidth: 400,
    borderRadius: PILL,
    ...Platform.select({
      ios: {
        shadowColor: premiumButton.shadowColor,
        shadowOffset: premiumButton.shadowOffset,
        shadowOpacity: premiumButton.shadowOpacity,
        shadowRadius: premiumButton.shadowRadius,
      },
      android: {
        elevation: premiumButton.elevation,
      },
    }),
  },
  premiumBtnTouchable: {
    width: '100%',
    borderRadius: PILL,
    borderWidth: 1,
    borderColor: premiumButton.rimOuter,
    overflow: 'hidden',
  },
  premiumBtnDisabled: {
    opacity: 0.5,
  },
  premiumBtnClip: {
    borderRadius: PILL,
    minHeight: premiumButton.minHeight,
    paddingVertical: premiumButton.padV,
    paddingHorizontal: premiumButton.padH,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  premiumBtnGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: PILL,
    borderTopRightRadius: PILL,
  },
  premiumBtnRim: {
    position: 'absolute',
    top: 1,
    left: '8%',
    right: '8%',
    height: 1,
    backgroundColor: premiumButton.rimLine,
    borderRadius: 1,
    opacity: 0.95,
  },
  premiumBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  premiumBtnLabel: {
    color: premiumButton.labelColor,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.35,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.22)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: loginScreen.footerBorder,
    backgroundColor: loginScreen.background,
  },
  footerText: {
    color: loginScreen.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  footerLink: {
    color: loginScreen.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  footerDot: {
    color: loginScreen.textSecondary,
    fontSize: 13,
  },
  dialog: {
    backgroundColor: loginScreen.background,
    borderRadius: 12,
  },
});
