import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/auth-store';
import { useRouter } from 'expo-router';
import { CognitoAuthButtons } from '../../components/CognitoAuthButtons';
import { cognitoConfigured, useMockAuth } from '../../lib/auth-config';
import { ScrollScreen, SectionHeader, PrimaryButton, PremiumTextInput } from '@/components/ui';
import { appShell, palette, spacing, radius } from '@/theme';
import { fonts } from '@/components/ui/typography';

const NICHES = [
  'Fashion',
  'Beauty',
  'Lifestyle',
  'Fitness',
  'Health',
  'Food',
  'Travel',
  'Technology',
  'Gaming',
  'Education',
  'Business',
  'Finance',
  'Entertainment',
  'Sports',
  'Music',
  'Art',
  'Photography',
  'Parenting',
  'Home & Decor',
  'Automotive',
];
const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'India',
  'Germany',
  'France',
  'Japan',
  'Brazil',
  'Other',
];

function LegacyMockRegisterForm() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    instagram: '',
    youtube: '',
    niche: '',
    country: '',
    bio: '',
    agreedToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading, error } = useAuthStore();
  const router = useRouter();

  const validate = () => {
    if (!form.fullName || form.fullName.length < 2) return 'Name must be at least 2 characters';
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      return 'Invalid email address';
    if (!form.password || form.password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(form.password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(form.password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(form.password)) return 'Password must contain at least one number';
    if (!/[^A-Za-z0-9]/.test(form.password))
      return 'Password must contain at least one special character';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    if (!form.phone || form.phone.length < 10) return 'Phone number must be at least 10 digits';
    if (form.instagram && !/^https?:\/\/.+/.test(form.instagram)) return 'Invalid Instagram URL';
    if (form.youtube && !/^https?:\/\/.+/.test(form.youtube)) return 'Invalid YouTube URL';
    if (!form.niche) return 'Please select your niche';
    if (!form.country) return 'Please select a country';
    if (form.bio && form.bio.length > 500) return 'Bio must be less than 500 characters';
    if (!form.agreedToTerms) return 'You must agree to the terms and conditions';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }
    try {
      await register(form);
      Alert.alert(
        'Registration Successful',
        'Your account is pending approval or has been created.'
      );
      router.replace('/influencer/dashboard');
    } catch (e: unknown) {
      Alert.alert(
        'Registration Failed',
        e instanceof Error ? e.message : 'Please try again later.'
      );
    }
  };

  return (
    <ScrollScreen scrollProps={{ contentContainerStyle: styles.container }}>
      <SectionHeader
        title="Join as Influencer (dev)"
        subtitle="Mock registration — no Cognito. Disable with useMockAuth in app.json."
      />
      <PremiumTextInput
        style={styles.input}
        placeholder="Full Name"
        value={form.fullName}
        onChangeText={(v) => setForm((f) => ({ ...f, fullName: v }))}
      />
      <PremiumTextInput
        style={styles.input}
        placeholder="Email"
        value={form.email}
        onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <PremiumTextInput
        style={styles.input}
        placeholder="Password"
        value={form.password}
        onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
        secureTextEntry={!showPassword}
      />
      <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
        <Text style={styles.toggle}>{showPassword ? 'Hide' : 'Show'} Password</Text>
      </TouchableOpacity>
      <PremiumTextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={form.confirmPassword}
        onChangeText={(v) => setForm((f) => ({ ...f, confirmPassword: v }))}
        secureTextEntry={!showConfirmPassword}
      />
      <TouchableOpacity onPress={() => setShowConfirmPassword((s) => !s)}>
        <Text style={styles.toggle}>{showConfirmPassword ? 'Hide' : 'Show'} Confirm Password</Text>
      </TouchableOpacity>
      <PremiumTextInput
        style={styles.input}
        placeholder="Phone"
        value={form.phone}
        onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
        keyboardType="phone-pad"
      />
      <PremiumTextInput
        style={styles.input}
        placeholder="Instagram Profile URL"
        value={form.instagram}
        onChangeText={(v) => setForm((f) => ({ ...f, instagram: v }))}
      />
      <PremiumTextInput
        style={styles.input}
        placeholder="YouTube Profile URL"
        value={form.youtube}
        onChangeText={(v) => setForm((f) => ({ ...f, youtube: v }))}
      />
      <Text style={styles.label}>Niche</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {NICHES.map((niche) => (
          <TouchableOpacity
            key={niche}
            style={[styles.chip, form.niche === niche && styles.chipSelected]}
            onPress={() => setForm((f) => ({ ...f, niche }))}
          >
            <Text style={form.niche === niche ? styles.chipTextSelected : styles.chipText}>
              {niche}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.label}>Country</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {COUNTRIES.map((country) => (
          <TouchableOpacity
            key={country}
            style={[styles.chip, form.country === country && styles.chipSelected]}
            onPress={() => setForm((f) => ({ ...f, country }))}
          >
            <Text style={form.country === country ? styles.chipTextSelected : styles.chipText}>
              {country}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <PremiumTextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Bio (optional, max 500 chars)"
        value={form.bio}
        onChangeText={(v) => setForm((f) => ({ ...f, bio: v }))}
        multiline
        maxLength={500}
      />
      <View style={styles.checkboxRow}>
        <TouchableOpacity
          onPress={() => setForm((f) => ({ ...f, agreedToTerms: !f.agreedToTerms }))}
          style={styles.checkbox}
        >
          <Text>{form.agreedToTerms ? '☑' : '☐'}</Text>
        </TouchableOpacity>
        <Text style={{ marginLeft: 8 }}>I agree to the terms and conditions</Text>
      </View>
      <PrimaryButton
        label="Register"
        onPress={handleRegister}
        loading={isLoading}
        disabled={isLoading}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </ScrollScreen>
  );
}

export default function InfluencerRegisterScreen() {
  const router = useRouter();

  if (cognitoConfigured) {
    return (
      <>
        <ScrollScreen>
          <SectionHeader
            title="Join as Influencer"
            subtitle="Sign in with Single Sign-On. You can complete your profile after login."
          />
          <CognitoAuthButtons mode="register" />
          {!useMockAuth ? (
            <TouchableOpacity
              onPress={() => router.push('/login')}
              style={{ marginTop: spacing.lg }}
            >
              <Text style={styles.link}>Already have an account? Sign in</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.sub, { marginTop: spacing.lg }]}>
              Or use the legacy mock form below (development only).
            </Text>
          )}
        </ScrollScreen>
        {useMockAuth ? <LegacyMockRegisterForm /> : null}
      </>
    );
  }

  if (useMockAuth) {
    return <LegacyMockRegisterForm />;
  }

  return (
    <ScrollScreen
      scrollProps={{
        contentContainerStyle: {
          flexGrow: 1,
          justifyContent: 'center',
          paddingVertical: spacing.xl,
        },
      }}
    >
      <SectionHeader
        title="Cognito not configured"
        subtitle="Set EXPO_PUBLIC_COGNITO_* in mobile/.env, or set useMockAuth to true for local mock registration."
      />
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Go back</Text>
      </TouchableOpacity>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.lg, flexGrow: 1 },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    color: appShell.textPrimary,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: appShell.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: appShell.borderSubtle,
    borderRadius: radius.md,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    color: appShell.textPrimary,
    backgroundColor: appShell.card,
    fontFamily: fonts.regular,
  },
  label: {
    fontFamily: fonts.semiBold,
    marginBottom: 4,
    color: appShell.textPrimary,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: appShell.borderSubtle,
    marginRight: 8,
  },
  chipSelected: { backgroundColor: appShell.cta, borderColor: appShell.cta },
  chipText: { color: appShell.textPrimary, fontFamily: fonts.regular },
  chipTextSelected: { color: palette.white, fontFamily: fonts.regular },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: appShell.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggle: { color: appShell.cta, marginBottom: 8, textAlign: 'right', fontFamily: fonts.regular },
  error: { color: palette.error, marginTop: 8, textAlign: 'center', fontFamily: fonts.regular },
  link: { color: appShell.cta, marginTop: 16, textAlign: 'center', fontFamily: fonts.semiBold },
});
