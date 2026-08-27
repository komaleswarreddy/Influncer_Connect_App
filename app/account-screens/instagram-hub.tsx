import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabButton,
  Glyph,
  KollabStatusChip,
  showKollabToast,
  showKollabConfirm,
} from '@/components/ui';
import { useInstagramAutomationStore } from '@/store/instagram-automation-store';
import { useSchedulerStore } from '@/store/scheduler-store';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';

export default function InstagramHubScreen() {
  const router = useRouter();
  const kollab = useKollab();
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
    if (error) {
      showKollabToast(error);
      clearError();
    }
  }, [error, clearError]);

  if (isLoading && !connection) {
    return (
      <ScrollScreen>
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 32 }} />
      </ScrollScreen>
    );
  }

  if (!isConnected) {
    return (
      <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
        <KollabScreenHeader title="Instagram" subtitle="Not connected" />
        <View
          style={[styles.connectCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
        >
          <View style={[styles.igWell, { backgroundColor: kollab.color.tint }]}>
            <Glyph name="ig" color={kollab.color.violet} size={26} />
          </View>
          <Text style={[styles.connectTitle, { color: kollab.color.ink }]}>
            Connect your{' '}
            <Text style={{ fontFamily: font.displayItalic, color: kollab.color.violet }}>
              Instagram
            </Text>
          </Text>
          <Text style={[styles.connectBody, { color: kollab.color.ink }]}>
            One connection powers DM automations and scheduled reels, posts, and stories.
          </Text>
          <KollabButton
            label={isSaving ? 'Connecting…' : 'Connect Instagram'}
            disabled={isSaving}
            onPress={() => void connectInstagram()}
          />
        </View>
        <View
          style={[styles.previewCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
        >
          <Text style={[styles.previewTitle, { color: kollab.color.ink }]}>Schedule Content</Text>
          <Text style={[styles.previewBody, { color: kollab.color.ink }]}>
            Upload reels and posts, write captions, and pick a publish time.
          </Text>
        </View>
        <View
          style={[styles.previewCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
        >
          <Text style={[styles.previewTitle, { color: kollab.color.ink }]}>DM Automation</Text>
          <Text style={[styles.previewBody, { color: kollab.color.ink }]}>
            Auto-reply to comments, story replies, and DM keywords on specific content.
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/account-screens/trending-ideas' as never)}
          style={[
            styles.tool,
            { backgroundColor: kollab.color.card, marginBottom: 10 },
            kollab.shadow.card,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Trending ideas"
        >
          <View style={[styles.toolIcon, { backgroundColor: kollab.color.tint }]}>
            <Glyph name="trend" color={kollab.color.violet} size={21} />
          </View>
          <View style={styles.toolCopy}>
            <Text style={[styles.toolTitle, { color: kollab.color.ink }]}>Trending ideas</Text>
            <Text style={[styles.toolMeta, { color: kollab.color.ink }]}>
              AI briefs for your niche
            </Text>
          </View>
          <Text style={[styles.chevron, { color: kollab.color.ink }]}>›</Text>
        </Pressable>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KollabScreenHeader
        title="Instagram"
        subtitle={
          connection?.instagramUsername ? `@${connection.instagramUsername}` : 'Connected tools'
        }
      />

      {!hasPublishScope ? (
        <View style={[styles.banner, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
          <Text style={[styles.bannerTitle, { color: kollab.color.ink }]}>
            Reconnect to schedule posts
          </Text>
          <Text style={[styles.bannerBody, { color: kollab.color.ink }]}>
            Publishing permission is missing. Reconnect Instagram to enable the content scheduler.
          </Text>
          <KollabButton
            label={isSaving ? 'Reconnecting…' : 'Reconnect Instagram'}
            disabled={isSaving}
            onPress={() => void connectInstagram()}
          />
        </View>
      ) : null}

      <View style={[styles.liveBar, { backgroundColor: kollab.color.panel }]}>
        <View style={[styles.liveIcon, { backgroundColor: kollab.color.chartreuse }]}>
          <Glyph name="ig" color={kollab.color.onChartreuse} size={22} />
        </View>
        <View style={styles.liveCopy}>
          <Text style={[styles.liveName, { color: kollab.color.panelInk }]}>
            @{connection?.instagramUsername}
          </Text>
          <Text style={[styles.liveMeta, { color: kollab.color.panelInk }]}>
            {connection?.accountType ?? 'Business'} · connected
          </Text>
        </View>
        <KollabStatusChip tone="live" label="Live" />
      </View>

      <View style={styles.tools}>
        <Pressable
          onPress={() => router.push('/account-screens/schedule-content' as never)}
          style={[styles.tool, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
        >
          <View style={[styles.toolIcon, { backgroundColor: kollab.color.tint }]}>
            <Glyph name="schedule" color={kollab.color.violet} size={21} />
          </View>
          <View style={styles.toolCopy}>
            <Text style={[styles.toolTitle, { color: kollab.color.ink }]}>Schedule Content</Text>
            <Text style={[styles.toolMeta, { color: kollab.color.ink }]}>
              {scheduledCount} post{scheduledCount === 1 ? '' : 's'} scheduled
            </Text>
          </View>
          <Text style={[styles.chevron, { color: kollab.color.ink }]}>›</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/account-screens/dm-automation' as never)}
          style={[styles.tool, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
        >
          <View style={[styles.toolIcon, { backgroundColor: kollab.color.tint }]}>
            <Glyph name="dm" color={kollab.color.violet} size={21} />
          </View>
          <View style={styles.toolCopy}>
            <Text style={[styles.toolTitle, { color: kollab.color.ink }]}>DM Automation</Text>
            <Text style={[styles.toolMeta, { color: kollab.color.ink }]}>
              {activeAutomations} automation{activeAutomations === 1 ? '' : 's'} active
            </Text>
          </View>
          <Text style={[styles.chevron, { color: kollab.color.ink }]}>›</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/account-screens/trending-ideas' as never)}
          style={[styles.tool, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
        >
          <View style={[styles.toolIcon, { backgroundColor: kollab.color.tint }]}>
            <Glyph name="trend" color={kollab.color.violet} size={21} />
          </View>
          <View style={styles.toolCopy}>
            <Text style={[styles.toolTitle, { color: kollab.color.ink }]}>Trending ideas</Text>
            <Text style={[styles.toolMeta, { color: kollab.color.ink }]}>
              AI briefs for your niche
            </Text>
          </View>
          <Text style={[styles.chevron, { color: kollab.color.ink }]}>›</Text>
        </Pressable>
      </View>

      <KollabButton
        label={isSaving ? 'Disconnecting…' : 'Disconnect Instagram'}
        variant="hairline"
        disabled={isSaving}
        onPress={() => {
          if (isSaving) return;
          void showKollabConfirm({
            title: 'Disconnect Instagram?',
            message:
              'DM automations will pause. Scheduled posts stay in your queue but will not publish until you reconnect.',
            confirmLabel: 'Disconnect',
            destructive: true,
          }).then((ok) => {
            if (ok) void disconnectInstagram();
          });
        }}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  connectCard: { borderRadius: 24, padding: 24, marginBottom: 12 },
  igWell: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  connectTitle: { ...kType.sectionTitle },
  connectBody: {
    fontFamily: font.body,
    fontSize: 13.5,
    lineHeight: 21,
    opacity: 0.6,
    marginVertical: 8,
  },
  previewCard: { borderRadius: 22, padding: 18, marginBottom: 10, opacity: 0.65 },
  previewTitle: { ...kType.rowTitle },
  previewBody: {
    fontFamily: font.body,
    fontSize: 12.5,
    lineHeight: 19,
    opacity: 0.6,
    marginTop: 4,
  },
  banner: { borderRadius: 22, padding: 16, marginBottom: 16, gap: 8 },
  bannerTitle: { fontFamily: font.semiBold, fontSize: 15 },
  bannerBody: { fontFamily: font.body, fontSize: 13, opacity: 0.55, marginBottom: 6 },
  liveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  liveIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveCopy: { flex: 1 },
  liveName: { fontFamily: font.semiBold, fontSize: 15 },
  liveMeta: { fontFamily: font.body, fontSize: 12, opacity: 0.6 },
  tools: { gap: 10, marginBottom: 18 },
  tool: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolCopy: { flex: 1 },
  toolTitle: { ...kType.rowTitle },
  toolMeta: { fontFamily: font.body, fontSize: 12, opacity: 0.55, marginTop: 1 },
  chevron: { fontSize: 16, opacity: 0.35 },
});
