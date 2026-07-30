import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton, ScrollScreen } from '@/components/ui';
import { fonts } from '@/components/ui/typography';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { appShell, palette, radius, spacing } from '@/theme';

const USERNAME_PATTERN = /^[a-zA-Z0-9_ ]{3,30}$/;

function sanitize(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_ ]/g, '').replace(/\s+/g, ' ');
}

export default function SetUsernameScreen() {
  const router = useRouter();
  const { logout, refreshSession } = useAuthStore();
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(() => USERNAME_PATTERN.test(username), [username]);

  const onSubmit = async () => {
    if (!isValid || submitting) return;
    const cleaned = sanitize(username).trim();
    if (!USERNAME_PATTERN.test(cleaned)) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.patch('/api/influencers/username', { username: cleaned });
      await refreshSession({ logoutOnUnauthorized: false });
      useAuthStore.getState().clearProfileGate();
      router.replace('/influencer/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save your username. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onSignOut = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollScreen
      dotBackground
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{ contentContainerStyle: styles.pad }}
    >
      <Text style={styles.eyebrow}>One last step</Text>
      <Text style={styles.title}>Pick your username</Text>
      <Text style={styles.body}>
        This is how you&apos;ll appear across Influencer Connect — on campaigns, catalogs, and
        anywhere brands see your profile.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <View style={[styles.inputRow, error && styles.inputRowError]}>
          <Text style={styles.atSign}>@</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={(text) => {
              setUsername(sanitize(text));
              if (error) setError(null);
            }}
            placeholder="your name"
            placeholderTextColor={appShell.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
            maxLength={30}
            selectionColor={appShell.cta}
            onSubmitEditing={onSubmit}
            returnKeyType="done"
          />
        </View>
        <Text style={[styles.hint, error && styles.hintError]}>
          {error ?? 'Letters, numbers, spaces, and underscores · 3–30 characters'}
        </Text>
      </View>

      <PrimaryButton
        label={submitting ? 'Saving…' : 'Continue'}
        onPress={onSubmit}
        disabled={!isValid || submitting}
        loading={submitting}
      />

      <View style={styles.signOutWrap}>
        {submitting ? null : (
          <Text style={styles.signOut} onPress={onSignOut}>
            Not you? Sign out
          </Text>
        )}
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  pad: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  eyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: appShell.textSecondary,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: appShell.textPrimary,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: appShell.textSecondary,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: appShell.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: appShell.textPrimary,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appShell.canvasAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  inputRowError: {
    borderColor: palette.error,
  },
  atSign: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: appShell.textMuted,
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: appShell.textPrimary,
    paddingVertical: 12,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: appShell.textMuted,
    marginTop: spacing.xs,
  },
  hintError: {
    color: palette.error,
  },
  signOutWrap: {
    alignItems: 'center',
    marginTop: spacing.lg,
    minHeight: 20,
  },
  signOut: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: appShell.textMuted,
    textDecorationLine: 'underline',
  },
});
