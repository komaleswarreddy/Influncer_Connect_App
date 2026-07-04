import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollScreen, PrimaryButton, SecondaryButton, SectionHeader, PremiumCard } from '@/components/ui';
import { useInstagramAutomationStore } from '@/store/instagram-automation-store';
import {
  instagramAutomationApi,
  type DmAutomation,
  type DmAutomationLog,
  type InstagramMediaItem,
} from '@/lib/instagram-automation-api';
import { appShell, spacing, radius, palette } from '@/theme';
import { fonts } from '@/components/ui/typography';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AutomationDetailScreen() {
  const router = useRouter();
  const { automationId } = useLocalSearchParams<{ automationId: string }>();
  const { toggleAutomation, deleteAutomation, isSaving } = useInstagramAutomationStore();

  const [automation, setAutomation] = useState<DmAutomation | null>(null);
  const [logs, setLogs] = useState<DmAutomationLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [linkedMedia, setLinkedMedia] = useState<InstagramMediaItem | null>(null);

  const loadAutomation = useCallback(async () => {
    if (!automationId) return;
    const res = await instagramAutomationApi.getAutomations();
    const found = res.automations.find((a) => a.id === automationId) ?? null;
    setAutomation(found);
    if (found?.linkedMedia) {
      setLinkedMedia(found.linkedMedia);
    } else if (found?.specificPostId) {
      try {
        const res = await instagramAutomationApi.getMediaById(found.specificPostId);
        setLinkedMedia(res.media);
      } catch {
        setLinkedMedia(null);
      }
    } else {
      setLinkedMedia(null);
    }
    if (!found) {
      Alert.alert('Not found', 'Automation could not be loaded.');
      router.back();
    }
  }, [automationId, router]);

  const loadLogs = useCallback(
    async (nextPage: number, append: boolean) => {
      if (!automationId) return;
      if (append) setLoadingMore(true);
      else setLoading(true);
      try {
        const res = await instagramAutomationApi.getAutomationLogs(automationId, nextPage);
        setLogs((prev) => (append ? [...prev, ...res.logs] : res.logs));
        setPage(res.page);
        setTotal(res.total);
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load logs');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [automationId]
  );

  useEffect(() => {
    void loadAutomation();
    void loadLogs(1, false);
  }, [loadAutomation, loadLogs]);

  const handleToggle = async () => {
    if (!automation) return;
    await toggleAutomation(automation.id);
    setAutomation({ ...automation, isActive: !automation.isActive });
  };

  const handleDelete = () => {
    if (!automation) return;
    Alert.alert('Delete automation?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteAutomation(automation.id).then(() => {
            router.replace('/account-screens/dm-automation' as never);
          });
        },
      },
    ]);
  };

  const hasMore = logs.length < total;

  if (loading && !automation) {
    return (
      <ScrollScreen>
        <ActivityIndicator color={appShell.cta} style={{ marginTop: spacing.xl }} />
      </ScrollScreen>
    );
  }

  if (!automation) return null;

  const stats = automation.stats;

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title={automation.name} subtitle="Automation details" />

      {linkedMedia ? (
        <PremiumCard style={styles.mediaCard}>
          <View style={styles.mediaRow}>
            {linkedMedia.thumbnailUrl ? (
              <Image source={{ uri: linkedMedia.thumbnailUrl }} style={styles.mediaThumb} />
            ) : null}
            <View style={styles.mediaCopy}>
              <Text style={styles.mediaKind}>
                {(linkedMedia.kind || 'content').toUpperCase()}
              </Text>
              {linkedMedia.caption ? (
                <Text style={styles.mediaCaption} numberOfLines={2}>
                  {linkedMedia.caption}
                </Text>
              ) : (
                <Text style={styles.mediaCaptionMuted}>Linked Instagram content</Text>
              )}
              {(linkedMedia.likeCount != null || linkedMedia.commentCount != null) && (
                <Text style={styles.mediaStats}>
                  {linkedMedia.likeCount != null ? linkedMedia.likeCount + ' likes' : ''}
                  {linkedMedia.likeCount != null && linkedMedia.commentCount != null ? ' · ' : ''}
                  {linkedMedia.commentCount != null ? linkedMedia.commentCount + ' comments' : ''}
                </Text>
              )}
            </View>
          </View>
        </PremiumCard>
      ) : null}


      <PremiumCard style={styles.card}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{automation.isActive ? 'Active' : 'Paused'}</Text>
          <Switch
            value={automation.isActive}
            onValueChange={() => void handleToggle()}
            disabled={isSaving}
            trackColor={{ false: appShell.borderSubtle, true: appShell.cta }}
            thumbColor={palette.white}
          />
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalTriggered ?? automation.totalSent}</Text>
            <Text style={styles.statLabel}>Triggered</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalSent ?? automation.totalSent}</Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalDelivered ?? 0}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalRepliedBack ?? automation.totalReplied}</Text>
            <Text style={styles.statLabel}>Replied back</Text>
          </View>
        </View>
      </PremiumCard>

      <View style={styles.actions}>
        <PrimaryButton
          label="Edit"
          compact
          onPress={() =>
            router.push({
              pathname: '/account-screens/create-automation',
              params: { automationId: automation.id },
            } as never)
          }
        />
        <SecondaryButton label="Delete" onPress={handleDelete} />
      </View>

      <Text style={styles.logsTitle}>Activity log</Text>
      {logs.length === 0 && !loading ? (
        <PremiumCard>
          <Text style={styles.emptyLogs}>No activity yet. Triggers will appear here.</Text>
        </PremiumCard>
      ) : (
        <PremiumCard padded={false}>
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.logRow}>
                <View style={styles.logHeader}>
                  <Text style={styles.logUser}>@{item.triggerUsername ?? item.triggerUserId}</Text>
                  <Text style={styles.logDate}>{formatDate(item.createdAt)}</Text>
                </View>
                {item.triggerText ? <Text style={styles.logText}>{item.triggerText}</Text> : null}
                <Text style={styles.logStatus}>
                  {item.deliveryStatus}
                  {item.errorMessage ? ` · ${item.errorMessage}` : ''}
                </Text>
              </View>
            )}
            ListFooterComponent={
              hasMore ? (
                <View style={styles.loadMoreWrap}>
                  <SecondaryButton
                    label={loadingMore ? 'Loading...' : 'Load more'}
                    disabled={loadingMore}
                    onPress={() => void loadLogs(page + 1, true)}
                  />
                </View>
              ) : null
            }
          />
        </PremiumCard>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  mediaCard: { marginBottom: spacing.md },
  mediaRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  mediaThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: appShell.iceBlue,
  },
  mediaCopy: { flex: 1, gap: spacing.xs },
  mediaKind: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: appShell.cta,
    letterSpacing: 0.5,
  },
  mediaCaption: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: appShell.textPrimary,
  },
  mediaCaptionMuted: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: appShell.textMuted,
  },
  mediaStats: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: appShell.textSecondary,
  },
  card: { marginBottom: spacing.md },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  toggleLabel: { fontFamily: fonts.semiBold, fontSize: 15, color: appShell.textPrimary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statItem: {
    width: '47%',
    backgroundColor: appShell.canvasAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  statValue: { fontFamily: fonts.bold, fontSize: 18, color: appShell.textPrimary },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, color: appShell.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  logsTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: appShell.textSecondary,
    marginBottom: spacing.sm,
  },
  emptyLogs: { fontFamily: fonts.regular, fontSize: 13, color: appShell.textSecondary, textAlign: 'center' },
  logRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appShell.borderSubtle,
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logUser: { fontFamily: fonts.semiBold, fontSize: 13, color: appShell.textPrimary },
  logDate: { fontFamily: fonts.regular, fontSize: 11, color: appShell.textMuted },
  logText: { fontFamily: fonts.regular, fontSize: 13, color: appShell.textSecondary, marginTop: 4 },
  logStatus: { fontFamily: fonts.regular, fontSize: 11, color: appShell.textMuted, marginTop: 4 },
  loadMoreWrap: { padding: spacing.md },
});
