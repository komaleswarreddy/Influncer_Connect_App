import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabButton,
  KollabSectionLabel,
  KollabStatusChip,
  showKollabToast,
} from '@/components/ui';
import { useInstagramAutomationStore } from '@/store/instagram-automation-store';
import type { DmAutomation, DmTriggerType } from '@/lib/instagram-automation-api';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';

const TRIGGER_LABELS: Record<DmTriggerType, string> = {
  comment_keyword: 'Comment keyword',
  story_reply: 'Story reply',
  dm_keyword: 'DM keyword',
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

function AutomationCard({
  automation,
  onPress,
}: {
  automation: DmAutomation;
  onPress: () => void;
}) {
  const kollab = useKollab();
  const match = automation.matchType === 'exact' ? 'exact match' : automation.matchType;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.autoCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
    >
      <View style={styles.autoHead}>
        <View style={styles.autoCopy}>
          <Text style={[styles.autoName, { color: kollab.color.ink }]} numberOfLines={1}>
            {automation.name}
          </Text>
          <Text style={[styles.autoMeta, { color: kollab.color.ink }]}>
            {TRIGGER_LABELS[automation.triggerType]} · {match}
          </Text>
        </View>
        <KollabStatusChip
          tone={automation.isActive ? 'live' : 'neutral'}
          label={automation.isActive ? 'Active' : 'Paused'}
        />
      </View>
      {automation.triggerKeywords.length > 0 ? (
        <View style={[styles.kwRow, { borderTopColor: kollab.color.hairline }]}>
          {automation.triggerKeywords.slice(0, 6).map((k) => (
            <View key={k} style={[styles.kw, { backgroundColor: kollab.color.tint }]}>
              <Text style={[styles.kwText, { color: kollab.color.violetDeep }]}>{k}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
}

export default function DmAutomationScreen() {
  const kollab = useKollab();
  const router = useRouter();
  const {
    connection,
    isConnected,
    automations,
    summaryStats,
    isLoading,
    error,
    fetchConnectionStatus,
    fetchAutomations,
    fetchSummaryStats,
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
      showKollabToast(error);
      clearError();
    }
  }, [error, clearError]);

  if (isLoading && !connection && !isConnected) {
    return (
      <ScrollScreen>
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 32 }} />
      </ScrollScreen>
    );
  }

  if (!isConnected) {
    return (
      <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
        <KollabScreenHeader title="DM automation" subtitle="Manage Instagram auto-replies" />
        <View
          style={[styles.emptyCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
        >
          <Text style={[styles.emptyTitle, { color: kollab.color.ink }]}>
            Connect via Instagram hub
          </Text>
          <Text style={[styles.emptyBody, { color: kollab.color.ink }]}>
            DM automations use the same Instagram connection as content scheduling.
          </Text>
          <KollabButton
            label="Go to Instagram hub"
            onPress={() => router.push('/account-screens/instagram-hub' as never)}
          />
        </View>
      </ScrollScreen>
    );
  }

  const delivered = summaryStats?.totalDeliveredLast7Days ?? 0;
  const autoCount = automations.length;

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KollabScreenHeader title="DM automation" subtitle="Manage Instagram auto-replies" />

      <View style={styles.stats}>
        <View style={[styles.statDark, { backgroundColor: kollab.color.panel }]}>
          <Text style={[styles.statLabel, { color: kollab.color.panelInk }]}>Delivered</Text>
          <Text style={[styles.statValue, { color: kollab.color.chartreuse }]}>{delivered}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
          <Text style={[styles.statLabel, { color: kollab.color.ink }]}>Automations</Text>
          <Text style={[styles.statValue, { color: kollab.color.ink }]}>{autoCount}</Text>
        </View>
      </View>

      <KollabSectionLabel
        label="automations"
        trailing={
          <KollabButton
            label="Create"
            compact
            onPress={() => router.push('/account-screens/create-automation' as never)}
            style={styles.createBtn}
          />
        }
      />

      {isLoading && automations.length === 0 ? (
        <ActivityIndicator color={kollab.color.ink} style={{ marginVertical: 24 }} />
      ) : automations.length === 0 ? (
        <View
          style={[styles.emptyCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
        >
          <Text style={[styles.emptyTitle, { color: kollab.color.ink }]}>No automations yet</Text>
          <Text style={[styles.emptyBody, { color: kollab.color.ink }]}>
            Auto-reply to comments, story replies, and DM keywords.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {automations.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
              onPress={() =>
                router.push({
                  pathname: '/account-screens/automation-detail',
                  params: { automationId: automation.id },
                } as never)
              }
            />
          ))}
        </View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statDark: { flex: 1, borderRadius: 20, padding: 17 },
  statCard: { flex: 1, borderRadius: 20, padding: 17 },
  statLabel: { fontFamily: font.semiBold, fontSize: 11.5, opacity: 0.6 },
  statValue: { fontFamily: font.display, fontSize: 29, marginTop: 3 },
  createBtn: { paddingVertical: 7, paddingHorizontal: 14 },
  list: { gap: 10 },
  autoCard: { borderRadius: 22, paddingVertical: 16, paddingHorizontal: 18 },
  autoHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  autoCopy: { flex: 1, minWidth: 0 },
  autoName: { fontFamily: font.semiBold, fontSize: 14.5 },
  autoMeta: { fontFamily: font.body, fontSize: 12, opacity: 0.55, marginTop: 2 },
  kwRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  kw: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  kwText: { fontFamily: font.bold, fontSize: 11 },
  emptyCard: { borderRadius: 22, padding: 18, gap: 10 },
  emptyTitle: { ...kType.sectionTitle },
  emptyBody: { fontFamily: font.body, fontSize: 13, opacity: 0.55, lineHeight: 20 },
});
