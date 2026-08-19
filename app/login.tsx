import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore, getInfluencerEntryPath } from '../store/auth-store';
import { CognitoAuthButtons } from '../components/CognitoAuthButtons';
import { cognitoConfigured, useMockAuth } from '../lib/auth-config';
import { useKollab, asset, scrimStops, font } from '@/theme/kollab-tokens';
import { KollabTextField } from '@/components/ui/KollabTextField';
import { KollabButton } from '@/components/ui/KollabButton';

export default function LoginScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const { login, error: authError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onMockSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const step = useAuthStore.getState().nextStep;
      router.replace(getInfluencerEntryPath(step));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
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
          Welcome <Text style={[styles.welcomeEm, { color: kollab.color.chartreuse }]}>back</Text>.
        </Text>
        <Text style={styles.sub}>Sign in to continue to your workspace.</Text>

        {cognitoConfigured ? <CognitoAuthButtons mode="login" variant="lime" /> : null}

        <Pressable
          onPress={() => router.push('/register/influencer')}
          style={styles.glass}
          accessibilityRole="button"
          accessibilityLabel="Create new account"
        >
          <Text style={styles.glassLabel}>Create new account</Text>
        </Pressable>

        {useMockAuth && !cognitoConfigured ? (
          <View style={styles.mockBlock}>
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

        {!cognitoConfigured && !useMockAuth ? (
          <Text style={styles.configErr}>
            Set EXPO_PUBLIC_COGNITO_* in mobile/.env, or enable useMockAuth for local testing.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0906' },
  inner: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 38,
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
    maxWidth: 300,
  },
  glass: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  glassLabel: {
    fontFamily: font.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  mockBlock: {
    marginTop: 18,
    gap: 10,
  },
  err: {
    fontFamily: font.body,
    fontSize: 13,
  },
  configErr: {
    marginTop: 16,
    fontFamily: font.body,
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});
