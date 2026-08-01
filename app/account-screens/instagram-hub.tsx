import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScrollScreen,
  SectionHeader,
  PremiumCard,
  PrimaryButton,
  SecondaryButton,
} from '@/components/ui';
import { useInstagramAutomationStore } from '@/store/instagram-automation-store';
import { useSchedulerStore } from '@/store/scheduler-store';
import { appShell, spacing, radius, palette } from '@/theme';
import { fonts } from '@/components/ui/typography';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function InstagramHubScreen() {
  const router = useRouter();
  const {
    connection,
    isConnected,
    isLoading,
    isSaving,
    automations,
    error,
    fetchConnectionStatus,
    connectInstagram,
    disconnectInstagram,
    fetchAutomations,
    clearError,
  } = useInstagramAutomationStore();
  const { posts, fetchPosts } = useSchedulerStore();

  const hasPublishScope = connection?.hasPublishScope ?? false;
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const activeAutomations = automations.filter((a) => a.isActive).length;

  const refresh = useCallback(async () => {
    await fetchConnectionStatus();
    const state = useInstagramAutomationStore.getState();
    if (state.isConnected) {
      await Promise.all([fetchAutomations(), fetchPosts({ status: 'scheduled' })]);
    }
  }, [fetchConnectionStatus, fetchAutomations, fetchPosts]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (error) Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
  }, [error, clearError]);

  if (isLoading && !connection) {
    return (
      <ScrollScreen>
        <ActivityIndicator color={appShell.cta} style={{ marginTop: spacing.xl }} />
      </ScrollScreen>
    );
  }

  if (!isConnected) {
    return (
      <ScrollScreen safeAreaEdges={['bottom']}>
        <SectionHeader title="Instagram" subtitle="DM automation and content scheduling" />
        <PremiumCard style={styles.heroCard}>
          <Ionicons name="logo-instagram" size={40} color={appShell.cta} />
          <Text style={styles.heroTitle}>Connect your Instagram</Text>
          <Text style={styles.heroBody}>
            One connection powers DM automations and scheduled reels, posts, and stories.
          </Text>
          <PrimaryButton
            label="Connect Instagram"
            onPress={() => void connectInstagram()}
            loading={isSaving}
          />
        </PremiumCard>
        <PremiumCard style={styles.previewCard}>
          <Text style={styles.previewTitle}>Schedule Content</Text>
          <Text style={styles.previewBody}>
            Upload reels and posts, write captions, and pick a publish time.
          </Text>
        </PremiumCard>
        <PremiumCard style={styles.previewCard}>
          <Text style={styles.previewTitle}>DM Automation</Text>
          <Text style={styles.previewBody}>
            Auto-reply to comments, story replies, and DM keywords on specific content.
          </Text>
        </PremiumCard>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title="Instagram" subtitle="Connected tools" />

      {!hasPublishScope ? (
        <PremiumCard style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <Ionicons name="warning-outline" size={22} color={appShell.cta} />
            <View style={styles.bannerCopy}>
              <Text style={styles.bannerTitle}>Reconnect to schedule posts</Text>
              <Text style={styles.bannerBody}>
                Publishing permission is missing. Reconnect Instagram to enable the content
                scheduler.
              </Text>
            </View>
          </View>
          <PrimaryButton
            label="Reconnect Instagram"
            onPress={() => void connectInstagram()}
            loading={isSaving}
          />
        </PremiumCard>
      ) : null}

      <PremiumCard style={styles.profileCard}>
        <View style={styles.profileRow}>
          {connection?.profilePictureUrl ? (
            <Image source={{ uri: connection.profilePictureUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-outline" size={24} color={appShell.textMuted} />
            </View>
          )}
          <View style={styles.profileCopy}>
            <Text style={styles.username}>@{connection?.instagramUsername}</Text>
            <Text style={styles.followers}>
              {formatCount(connection?.followerCount ?? 0)} followers
            </Text>
          </View>
        </View>
      </PremiumCard>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/account-screens/schedule-content' as never)}
      >
        <PremiumCard style={styles.navCard}>
          <View style={styles.navRow}>
            <View style={styles.navIcon}>
              <Ionicons name="calendar-outline" size={24} color={appShell.cta} />
            </View>
            <View style={styles.navCopy}>
              <Text style={styles.navTitle}>Schedule Content</Text>
              <Text style={styles.navBody}>{scheduledCount} upcoming</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={appShell.textMuted} />
          </View>
        </PremiumCard>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/account-screens/dm-automation' as never)}
      >
        <PremiumCard style={styles.navCard}>
          <View style={styles.navRow}>
            <View style={styles.navIcon}>
              <Ionicons name="chatbubbles-outline" size={24} color={appShell.cta} />
            </View>
            <View style={styles.navCopy}>
              <Text style={styles.navTitle}>DM Automation</Text>
              <Text style={styles.navBody}>{activeAutomations} active</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={appShell.textMuted} />
          </View>
        </PremiumCard>
      </TouchableOpacity>

      <SecondaryButton
        label={isSaving ? 'Disconnecting…' : 'Disconnect Instagram'}
        disabled={isSaving}
        onPress={() => {
          if (isSaving) return;
          Alert.alert(
            'Disconnect Instagram?',
            'DM automations will pause. Scheduled posts stay in your queue but will not publish until you reconnect.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Disconnect',
                style: 'destructive',
                onPress: () => void disconnectInstagram(),
              },
            ]
          );
        }}
        style={[styles.disconnectBtn, isSaving && styles.disconnectBtnDisabled]}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  heroTitle: { fontFamily: fonts.bold, fontSize: 20, color: appShell.textPrimary },
  heroBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: appShell.textMuted,
    textAlign: 'center',
  },
  previewCard: { marginTop: spacing.sm },
  previewTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: appShell.textPrimary },
  previewBody: { fontFamily: fonts.regular, fontSize: 13, color: appShell.textMuted, marginTop: 4 },
  bannerCard: { marginBottom: spacing.md, gap: spacing.sm },
  bannerRow: { flexDirection: 'row', gap: spacing.sm },
  bannerCopy: { flex: 1 },
  bannerTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: appShell.textPrimary },
  bannerBody: { fontFamily: fonts.regular, fontSize: 13, color: appShell.textMuted, marginTop: 2 },
  profileCard: { marginBottom: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: radius.pill },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: appShell.canvasAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCopy: { flex: 1 },
  username: { fontFamily: fonts.semiBold, fontSize: 16, color: appShell.textPrimary },
  followers: { fontFamily: fonts.regular, fontSize: 13, color: appShell.textMuted },
  navCard: { marginBottom: spacing.sm },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: appShell.canvasAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCopy: { flex: 1 },
  navTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: appShell.textPrimary },
  navBody: { fontFamily: fonts.regular, fontSize: 13, color: appShell.textMuted },
  disconnectBtn: { marginTop: spacing.md },
  disconnectBtnDisabled: { opacity: 0.55 },
});
