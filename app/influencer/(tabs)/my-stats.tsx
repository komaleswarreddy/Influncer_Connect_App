import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { usePostAnalyzerStore } from '../../../store/post-analyzer-store';
import { useCampaignStore } from '../../../store/campaign-store';
import { useInfluencerStore } from '../../../store/influencer-store';
import {
  MyStatsHeroCard,
  MyStatsRatingCard,
  MyStatsAnalyzerGrid,
  MyStatsPlatformPills,
  MyStatsPostCard,
  type PlatformFilter,
} from '@/components/my-stats';
import { buildMyStatsSummary, buildRatingSummary } from '@/lib/my-stats-dashboard-stats';
import { PremiumCard, PrimaryButton } from '@/components/ui';
import { PostMetricsCard } from '@/components/PostMetricsCard';
import { appShell, radius, spacing, useAppShell } from '@/theme';
import { fonts } from '@/components/ui/typography';
import { useTabBarInset } from '@/lib/tab-bar-inset';
import { isPostAnalyzerDailyLimitError, type PostAnalysis } from '../../../lib/post-analyzer-api';

const ANALYZER_SCROLL_OFFSET = 520;

export default function MyStatsScreen() {
  const shell = useAppShell();
  const router = useRouter();
  const listRef = useRef<FlatList<PostAnalysis>>(null);
  const tabBarInset = useTabBarInset();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [analyzeInput, setAnalyzeInput] = useState('');

  const { participations, fetchParticipations } = useCampaignStore();
  const { ratings, fetchRatings } = useInfluencerStore();
  const {
    history,
    historyLoading,
    historyError,
    fetchHistory,
    historyTotal,
    historyPage,
    analyzeUrl,
    isAnalyzing,
    analyzeError,
    dailyLimitError,
    currentMetrics,
  } = usePostAnalyzerStore();

  const limitNotice =
    dailyLimitError ||
    (analyzeError && isPostAnalyzerDailyLimitError(analyzeError) ? analyzeError : null);
  const hardAnalyzeError =
    analyzeError && !isPostAnalyzerDailyLimitError(analyzeError) ? analyzeError : null;

  const loadScreenData = useCallback(async () => {
    await Promise.all([fetchHistory(undefined, 1), fetchParticipations()]);
    const parts = useCampaignStore.getState().participations;
    await Promise.all(parts.map((p) => fetchRatings(p.id)));
  }, [fetchHistory, fetchParticipations, fetchRatings]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setInitialLoading(true);
      void loadScreenData().finally(() => {
        if (active) setInitialLoading(false);
      });
      return () => {
        active = false;
      };
    }, [loadScreenData])
  );

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (selectedPlatform === 'all') return sortedHistory;
    return sortedHistory.filter((item) => item.platform === selectedPlatform);
  }, [sortedHistory, selectedPlatform]);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of sortedHistory) {
      counts[item.platform] = (counts[item.platform] ?? 0) + 1;
    }
    return counts;
  }, [sortedHistory]);

  const summary = useMemo(() => buildMyStatsSummary(sortedHistory), [sortedHistory]);
  const ratingSummary = useMemo(
    () => buildRatingSummary(participations, ratings),
    [participations, ratings]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScreenData();
    setRefreshing(false);
  };

  const scrollToAnalyzer = () => {
    listRef.current?.scrollToOffset({ offset: ANALYZER_SCROLL_OFFSET, animated: true });
  };

  const hasMore = history.length < historyTotal;

  const ListHeader = (
    <View>
      <Text style={styles.pageTitle}>My Stats</Text>

      <MyStatsHeroCard style={styles.section} onAnalyticsPress={scrollToAnalyzer} />

      {historyError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{historyError}</Text>
          <TouchableOpacity onPress={() => void fetchHistory(undefined, 1)}>
            <Text style={styles.errorRetry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {initialLoading && history.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={appShell.cta} />
        </View>
      ) : null}

      <MyStatsRatingCard
        style={styles.section}
        summary={ratingSummary}
        onPress={() => router.push('/influencer/rating-cards' as never)}
      />

      <MyStatsAnalyzerGrid summary={summary} />

      <PremiumCard style={[styles.section, styles.analyzerCard]}>
        <Text style={[styles.analyzerLabel, { color: shell.textPrimary }]}>Analyze post URL</Text>
        <TextInput
          style={[
            styles.analyzerInput,
            {
              borderColor: shell.borderSubtle,
              backgroundColor: shell.canvasAlt,
              color: shell.textPrimary,
            },
          ]}
          value={analyzeInput}
          onChangeText={setAnalyzeInput}
          placeholder="https://instagram.com/p/..."
          placeholderTextColor={shell.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          selectionColor={shell.cta}
        />
        <PrimaryButton
          label={isAnalyzing ? 'Analyzing…' : 'Analyze'}
          onPress={async () => {
            const url = analyzeInput.trim();
            if (!url) return;
            const metrics = await analyzeUrl(url);
            const limitHit = Boolean(usePostAnalyzerStore.getState().dailyLimitError);
            // Clear after a successful run or a quota notice — keep URL on hard failures for retry.
            if (metrics || limitHit) {
              setAnalyzeInput('');
            }
            await fetchHistory(undefined, 1);
          }}
        />
        {limitNotice ? (
          <View
            style={[
              styles.limitNotice,
              {
                backgroundColor: shell.iceBlue,
                borderColor: shell.cardBorder,
              },
            ]}
          >
            <Text style={[styles.limitNoticeTitle, { color: shell.textPrimary }]}>
              Daily analysis limit reached
            </Text>
            <Text style={[styles.limitNoticeBody, { color: shell.textSecondary }]}>
              Your free analysis resets at midnight (UTC). You can still open posts you already
              analyzed today — that does not use another slot.
            </Text>
          </View>
        ) : null}
        {hardAnalyzeError ? <Text style={styles.errorText}>{hardAnalyzeError}</Text> : null}
        {currentMetrics ? (
          <View style={{ marginTop: spacing.sm }}>
            <PostMetricsCard metrics={currentMetrics} compact showThumbnail={false} />
          </View>
        ) : null}
      </PremiumCard>

      <MyStatsPlatformPills
        selected={selectedPlatform}
        onSelect={setSelectedPlatform}
        totalCount={sortedHistory.length}
        platformCounts={platformCounts}
      />
    </View>
  );

  const ListEmpty = (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>No posts analyzed yet</Text>
      <Text style={styles.emptySubtitle}>
        Open a campaign, submit your post URL during progress, and your metrics will appear here.
      </Text>
      <TouchableOpacity
        style={styles.emptyCta}
        onPress={() => router.push('/influencer/campaigns' as never)}
      >
        <Text style={styles.emptyCtaText}>Go to Campaigns</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: shell.canvas }]}
      edges={['top', 'left', 'right']}
    >
      <FlatList
        ref={listRef}
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MyStatsPostCard item={item} />}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!initialLoading ? ListEmpty : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appShell.cta} />
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={() => void fetchHistory(undefined, historyPage + 1)}
              disabled={historyLoading}
            >
              <Text style={styles.loadMoreText}>{historyLoading ? 'Loading...' : 'Load more'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.footerSpacer} />
          )
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: spacing.lg + tabBarInset }]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  analyzerLabel: { fontFamily: fonts.semiBold, fontSize: 14, marginBottom: spacing.xs },
  analyzerInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontFamily: fonts.regular,
    marginBottom: spacing.sm,
  },
  limitNotice: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  limitNoticeTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  limitNoticeBody: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  pageTitle: {
    fontSize: 24,
    color: appShell.textPrimary,
    fontFamily: fonts.bold,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
  },
  analyzerCard: {
    marginTop: spacing.md,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FECACA',
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#B91C1C',
  },
  errorRetry: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: appShell.cta,
  },
  emptyWrap: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 17,
    color: appShell.textPrimary,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: spacing.xs,
    textAlign: 'center',
    color: appShell.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  emptyCta: {
    marginTop: spacing.md,
    backgroundColor: appShell.cta,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  loadMoreBtn: {
    marginTop: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: appShell.cta,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  footerSpacer: {
    height: spacing.md,
  },
});
