import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton, SecondaryButton, ScrollScreen } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';
import { appShell, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { refreshSession, logout, nextStep } = useAuthStore();
  const [busy, setBusy] = useState(false);

  const onRefresh = async () => {
    setBusy(true);
    try {
      await refreshSession();
      const ns = useAuthStore.getState().nextStep;
      if (ns !== 'PENDING_PLATFORM_APPROVAL') {
        router.replace('/influencer/dashboard');
      }
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    await logout();
    router.replace('/login');
  };

  useEffect(() => {
    if (nextStep !== 'PENDING_PLATFORM_APPROVAL') {
      router.replace('/influencer/dashboard');
    }
  }, [nextStep, router]);

  if (nextStep !== 'PENDING_PLATFORM_APPROVAL') {
    return null;
  }

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']} scrollProps={{ contentContainerStyle: styles.pad }}>
      <Text style={styles.title}>Awaiting approval</Text>
      <Text style={styles.body}>
        Your account is registered. A platform administrator must approve your influencer access before you can use
        campaigns and the full app.
      </Text>
      <Text style={styles.hint}>We will email you at your sign-in address once you are approved. You can also tap
        refresh below after you receive confirmation.</Text>
      <View style={styles.actions}>
        <PrimaryButton
          label="I was approved — refresh"
          onPress={onRefresh}
          loading={busy}
          disabled={busy}
        />
        <SecondaryButton label="Sign out" onPress={onLogout} />
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  pad: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: appShell.textPrimary,
    marginBottom: spacing.md,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: appShell.textSecondary,
    marginBottom: spacing.sm,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: appShell.textMuted,
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.sm,
  },
});
