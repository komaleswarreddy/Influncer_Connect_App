import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Switch,
  Alert,
  Image,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ScrollScreen,
  PrimaryButton,
  SectionHeader,
  PremiumCard,
  SecondaryButton,
} from '@/components/ui';
import { useInstagramAutomationStore } from '@/store/instagram-automation-store';
import type { DmAutomation, DmTriggerType } from '@/lib/instagram-automation-api';
import { appShell, spacing, radius, palette } from '@/theme';
import { fonts } from '@/components/ui/typography';

const BENEFITS = [
  {
    icon: 'chatbubble-ellipses-outline' as const,
    title: 'Auto-reply to DMs',
    body: 'Send instant replies when followers message you.',
  },
  {
    icon: 'megaphone-outline' as const,
    title: 'Comment keyword triggers',
    body: 'Reply to comments with keywords like LINK or INFO.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'AI-powered replies',
    body: 'Generate personalized responses from your brand context.',
  },
];

const TRIGGER_LABELS: Record<DmTriggerType, string> = {
  comment_keyword: 'Comment keyword',
  story_reply: 'Story reply',
  dm_keyword: 'DM keyword',
};

const KIND_LABELS: Record<string, string> = {
  reel: 'Reel',
  post: 'Post',
  story: 'Story',
};

const CONNECTED_PATHS = ['instagram-connected', '/instagram-connected'];

function isInstagramConnectedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(':', '');
    if (scheme !== 'affiliateplatform' && scheme !== 'affiliate-platform') return false;
    const path = parsed.pathname.replace(/^\//, '');
    const hostMatch = parsed.host === 'instagram-connected';
    return hostMatch || CONNECTED_PATHS.some((p) => path === p || url.includes(p));
  } catch {
    return url.includes('instagram-connected');
  }
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function AutomationRow({
  automation,
  onPress,
  onToggle,
  toggling,
}: {
  automation: DmAutomation;
  onPress: () => void;
  onToggle: () => void;
  toggling: boolean;
}) {
  const media = automation.linkedMedia;
  const kindLabel = media?.kind ? (KIND_LABELS[media.kind] ?? media.kind) : null;

  return (
    <PremiumCard style={styles.automationCard}>
      <View style={styles.automationHeader}>
        {media?.thumbnailUrl ? (
          <Image source={{ uri: media.thumbnailUrl }} style={styles.automationThumb} />
        ) : (
          <View style={styles.automationThumbPlaceholder}>
            <Ionicons name="image-outline" size={22} color={appShell.textMuted} />
          </View>
        )}
        <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.automationCopy}>
          <View style={styles.automationTitleRow}>
            <Text style={styles.automationName} numberOfLines={1}>
              {automation.name}
            </Text>
            {kindLabel ? (
              <View style={styles.kindPill}>
                <Text style={styles.kindPillText}>{kindLabel}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.automationMeta}>
            {TRIGGER_LABELS[automation.triggerType]} · {automation.totalSent} sent
          </Text>
        </TouchableOpacity>
        <Switch
          value={automation.isActive}
          onValueChange={onToggle}
          disabled={toggling}
          trackColor={{ false: appShell.borderSubtle, true: appShell.cta }}
          thumbColor={palette.white}
        />
      </View>
      <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.automationFooter}>
        <View
          style={[
            styles.statusPill,
            automation.isActive ? styles.statusActive : styles.statusPaused,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              automation.isActive ? styles.statusTextActive : styles.statusTextPaused,
            ]}
          >
            {automation.isActive ? 'Active' : 'Paused'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={appShell.textMuted} />
      </TouchableOpacity>
    </PremiumCard>
  );
}

export default function DmAutomationScreen() {
  const router = useRouter();
  const {
    connection,
    isConnected,
    automations,
    summaryStats,
    isLoading,
    isSaving,
    error,
    fetchConnectionStatus,
    connectInstagram,
    fetchAutomations,
    fetchSummaryStats,
    toggleAutomation,
    clearError,
  } = useInstagramAutomationStore();

  const refreshConnected = useCallback(async () => {
    await fetchConnectionStatus();
    const status = useInstagramAutomationStore.getState();
    if (status.isConnected) {
      await Promise.all([fetchAutomations(), fetchSummaryStats()]);
    }
  }, [fetchConnectionStatus, fetchAutomations, fetchSummaryStats]);

  useFocusEffect(
    useCallback(() => {
      void refreshConnected();
    }, [refreshConnected])
  );

  useEffect(() => {
    const onUrl = (event: { url: string }) => {
      if (!isInstagramConnectedUrl(event.url)) return;
      void refreshConnected();
    };
    const sub = Linking.addEventListener('url', onUrl);
    void Linking.getInitialURL().then((url) => {
      if (url && isInstagramConnectedUrl(url)) void refreshConnected();
    });
    return () => sub.remove();
  }, [refreshConnected]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);
  if (isLoading && !connection && !isConnected) {
    return (
      <ScrollScreen>
        <ActivityIndicator color={appShell.cta} style={{ marginTop: spacing.xl }} />
      </ScrollScreen>
    );
  }

  if (!isConnected) {
    return (
      <ScrollScreen safeAreaEdges={['bottom']}>
        <SectionHeader title="DM Automation" subtitle="Automate Instagram replies" />
        <PremiumCard style={styles.heroCard}>
          <Ionicons name="logo-instagram" size={36} color={appShell.cta} />
          <Text style={styles.heroTitle}>Connect via Instagram hub</Text>
          <Text style={styles.heroBody}>
            DM automations use the same Instagram connection as content scheduling. Connect once in
            the Instagram hub.
          </Text>
          <PrimaryButton
            label="Go to Instagram hub"
            onPress={() => router.push('/account-screens/instagram-hub' as never)}
          />
        </PremiumCard>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title="DM Automation" subtitle="Manage Instagram auto-replies" />

      <PremiumCard style={styles.accountCard}>
        <View style={styles.accountRow}>
          {connection?.profilePictureUrl ? (
            <Image source={{ uri: connection.profilePictureUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="logo-instagram" size={24} color={appShell.cta} />
            </View>
          )}
          <View style={styles.accountCopy}>
            <Text style={styles.accountName}>@{connection?.instagramUsername ?? 'connected'}</Text>
            <Text style={styles.accountMeta}>
              {formatCount(connection?.followerCount ?? 0)} followers ·{' '}
              {connection?.accountType ?? 'Business'}
            </Text>
          </View>
        </View>
      </PremiumCard>

      {summaryStats ? (
        <View style={styles.statsRow}>
          <PremiumCard style={styles.statCard}>
            <Text style={styles.statValue}>{summaryStats.todaySent}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </PremiumCard>
          <PremiumCard style={styles.statCard}>
            <Text style={styles.statValue}>{summaryStats.totalSentLast7Days}</Text>
            <Text style={styles.statLabel}>7-day sent</Text>
          </PremiumCard>
          <PremiumCard style={styles.statCard}>
            <Text style={styles.statValue}>{summaryStats.totalDeliveredLast7Days}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </PremiumCard>
        </View>
      ) : null}

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Automations</Text>
        <PrimaryButton
          label="Create"
          compact
          pill
          onPress={() => router.push('/account-screens/create-automation' as never)}
        />
      </View>

      {isLoading && automations.length === 0 ? (
        <ActivityIndicator color={appShell.cta} style={{ marginVertical: spacing.lg }} />
      ) : automations.length === 0 ? (
        <PremiumCard style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No automations yet</Text>
          <Text style={styles.emptyBody}>
            Choose a reel, post, or story and set up keyword-triggered Auto DMs.
          </Text>
          <PrimaryButton
            label="Set up Auto DM"
            onPress={() => router.push('/account-screens/create-automation' as never)}
          />
        </PremiumCard>
      ) : (
        automations.map((automation) => (
          <AutomationRow
            key={automation.id}
            automation={automation}
            toggling={isSaving}
            onToggle={() => void toggleAutomation(automation.id)}
            onPress={() =>
              router.push({
                pathname: '/account-screens/automation-detail',
                params: { automationId: automation.id },
              } as never)
            }
          />
        ))
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  heroEmoji: { fontSize: 48, marginBottom: spacing.xs },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: appShell.textPrimary,
    textAlign: 'center',
  },
  heroBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: appShell.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  benefitsTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: appShell.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  benefitCard: { marginBottom: spacing.sm },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: appShell.iceBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCopy: { flex: 1 },
  benefitName: { fontFamily: fonts.semiBold, fontSize: 15, color: appShell.textPrimary },
  benefitBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: appShell.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  accountCard: { gap: spacing.md, marginBottom: spacing.md },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    backgroundColor: appShell.iceBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountCopy: { flex: 1 },
  accountName: { fontFamily: fonts.bold, fontSize: 16, color: appShell.textPrimary },
  accountMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: appShell.textSecondary,
    marginTop: 2,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  statValue: { fontFamily: fonts.bold, fontSize: 20, color: appShell.textPrimary },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: appShell.textSecondary,
    marginTop: 2,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  listTitle: { fontFamily: fonts.bold, fontSize: 16, color: appShell.textPrimary },
  automationCard: { marginBottom: spacing.sm },
  automationThumb: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: appShell.iceBlue,
  },
  automationThumbPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: appShell.iceBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  automationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  kindPill: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: appShell.iceBlue,
  },
  kindPillText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: appShell.cta,
    textTransform: 'uppercase',
  },
  automationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  automationCopy: { flex: 1 },
  automationName: { fontFamily: fonts.semiBold, fontSize: 15, color: appShell.textPrimary },
  automationMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: appShell.textSecondary,
    marginTop: 2,
  },
  automationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  statusActive: { backgroundColor: 'rgba(34, 197, 94, 0.12)' },
  statusPaused: { backgroundColor: appShell.iceBlue },
  statusText: { fontFamily: fonts.semiBold, fontSize: 11 },
  statusTextActive: { color: appShell.success },
  statusTextPaused: { color: appShell.textSecondary },
  emptyCard: { alignItems: 'center', gap: spacing.sm },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 16, color: appShell.textPrimary },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: appShell.textSecondary,
    textAlign: 'center',
  },
});
