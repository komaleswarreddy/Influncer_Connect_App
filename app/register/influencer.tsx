import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import { CognitoAuthButtons } from '../../components/CognitoAuthButtons';
import { cognitoConfigured, useMockAuth } from '../../lib/auth-config';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabTextField,
  KollabButton,
  showKollabToast,
} from '@/components/ui';
import { useKollab, font, space } from '@/theme/kollab-tokens';

const FIELDS = [
  { key: 'fullName', ph: 'Full Name' },
  { key: 'email', ph: 'Email' },
  { key: 'password', ph: 'Password', secure: true },
  { key: 'confirmPassword', ph: 'Confirm Password', secure: true },
  { key: 'phone', ph: 'Phone' },
  { key: 'instagram', ph: 'Instagram URL' },
  { key: 'youtube', ph: 'YouTube URL' },
] as const;

export default function InfluencerRegisterScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const { register, isLoading, error } = useAuthStore();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    instagram: '',
    youtube: '',
    bio: '',
    country: 'India',
    agreedToTerms: false,
  });

  const setField = (key: string, v: string) => setForm((f) => ({ ...f, [key]: v }));

  const onRegister = async () => {
    if (!form.agreedToTerms) {
      showKollabToast('You must agree to the terms and conditions');
      return;
    }
    if (useMockAuth) {
      try {
        await register(form);
        router.replace('/influencer/set-username');
      } catch (e: unknown) {
        showKollabToast(e instanceof Error ? e.message : 'Please try again.');
      }
    }
  };

  return (
    <ScrollScreen canvasColor={kollab.color.screen} padH={space.gutter}>
      <KollabScreenHeader
        title="Join as influencer"
        subtitle="Create your creator account"
        backTone="well"
        onBack={() => router.back()}
      />

      {cognitoConfigured ? (
        <View style={{ marginBottom: 18 }}>
          <CognitoAuthButtons mode="register" variant="lime" />
        </View>
      ) : null}

      {useMockAuth || !cognitoConfigured ? (
        <>
          <View style={{ gap: 10, marginBottom: 16 }}>
            {FIELDS.map((f) => (
              <KollabTextField
                key={f.key}
                placeholder={f.ph}
                value={form[f.key]}
                onChangeText={(v) => setField(f.key, v)}
                secureTextEntry={'secure' in f && f.secure}
                autoCapitalize={f.key === 'email' ? 'none' : 'sentences'}
                keyboardType={
                  f.key === 'email' ? 'email-address' : f.key === 'phone' ? 'phone-pad' : 'default'
                }
                surface="well"
              />
            ))}
            <KollabTextField
              placeholder="Bio (optional, max 500 chars)"
              value={form.bio}
              onChangeText={(v) => setField('bio', v)}
              multiline
              maxLength={500}
              surface="well"
            />
          </View>

          <Pressable
            onPress={() => setForm((f) => ({ ...f, agreedToTerms: !f.agreedToTerms }))}
            style={styles.termsRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: form.agreedToTerms }}
          >
            <View
              style={[
                styles.check,
                {
                  borderColor: kollab.color.outline,
                  backgroundColor: form.agreedToTerms ? kollab.color.chartreuse : 'transparent',
                },
              ]}
            >
              {form.agreedToTerms ? (
                <Text style={{ color: kollab.color.onChartreuse, fontSize: 13 }}>✓</Text>
              ) : null}
            </View>
            <Text style={[styles.termsLabel, { color: kollab.color.ink }]}>
              I agree to the terms and conditions
            </Text>
          </Pressable>

          <KollabButton
            label={isLoading ? 'Registering…' : 'Register'}
            onPress={onRegister}
            disabled={isLoading}
          />
          {error ? <Text style={[styles.err, { color: kollab.color.heat }]}>{error}</Text> : null}
        </>
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
