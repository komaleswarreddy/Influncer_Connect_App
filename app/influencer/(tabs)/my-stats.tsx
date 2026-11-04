import { openExternalUrl } from '../../../lib/safe-link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { usePostAnalyzerStore } from '../../../store/post-analyzer-store';
import { useCampaignStore } from '../../../store/campaign-store';
import { useInfluencerStore } from '../../../store/influencer-store';
import { useInstagramAutomationStore } from '@/store/instagram-automation-store';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabSectionLabel,
  KollabTextField,
  KollabAnalyzePulse,
} from '@/components/ui';
import { formatCompactNumber } from '@/lib/my-stats-dashboard-stats';
import {
  audienceCount,
  averageEngagementRate,
  formatReachCount,
  sumConnectedFollowers,
} from '@/lib/home-dashboard-stats';
import { isParticipationEnrolled } from '@/lib/campaign-participation-ui';
import { instagramAutomationApi } from '@/lib/instagram-automation-api';
import {
  isPostAnalyzerDailyLimitError,
  postAnalysisDisplayThumb,
  type PostAnalysis,
} from '../../../lib/post-analyzer-api';
import { getSessionToken } from '@/lib/secure-session';
import { useKollab, font, space, type as kType } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';

const FALLBACK_THUMBS = [
  require('../../../assets/Only_Use_these_images_assests/thumb-content-a.png'),
  require('../../../assets/Only_Use_these_images_assests/thumb-content-b.png'),
] as const;

function fallbackThumb(key: string) {
  const seed = String(key || 'post');
  let n = 0;
  for (let i = 0; i < seed.length; i++) n += seed.charCodeAt(i);
  return FALLBACK_THUMBS[n % FALLBACK_THUMBS.length];
}

function AnalyzedPostThumb({ item }: { item: PostAnalysis }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    void getSessionToken().then((value) => setToken(value ?? null));
  }, []);

  useEffect(() => {
    setFailed(false);
  }, [item.id]);

  const display = postAnalysisDisplayThumb(item);
  const ready = display?.kind !== 'proxy' || Boolean(token);
  const source =
    failed || !display || !ready
      ? fallbackThumb(item.id || item.url)
      : {
          uri: display.uri,
          headers:
            display.kind === 'proxy' && token ? { Authorization: `Bearer ${token}` } : undefined,
        };

  return (
    <Image
      source={source}
      style={StyleSheet.absoluteFillObject}
      contentFit="cover"
      cachePolicy="memory-disk"
      onError={() => setFailed(true)}
    />
  );
}

function formatEr(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0%';
  const v = n > 0 && n <= 1 ? n * 100 : n;
  return `${v.toFixed(2).replace(/\.?0+$/, '')}%`;
}

function formatEngPill(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '';
  const v = n > 0 && n <= 1 ? n * 100 : n;
  return `${v.toFixed(1).replace(/\.0$/, '')}% eng`;
}

function engagementFromAnalyzedPosts(items: PostAnalysis[]): number {
  if (items.length === 0) return 0;
  const ig = items.filter((item) => /instagram/i.test(`${item.platform || ''} ${item.url || ''}`));
  const rows = ig.length > 0 ? ig : items;
  const sum = rows.reduce((n, row) => n + Number(row.engagementRate || 0), 0);
  return sum / rows.length;
}

function postMeta(item: PostAnalysis): string {
  const kind = (item.contentType || item.platform || 'Post').replace(/_/g, ' ');
  const label = kind.charAt(0).toUpperCase() + kind.slice(1);
  const reach = typeof item.views === 'number' ? formatCompactNumber(item.views) : null;
  return reach ? `${label} · ${reach} reach` : label;
}

export default function MyStatsScreen() {
  const kollab = useKollab();
  const styles = useStyles(kollab);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [analyzeInput, setAnalyzeInput] = useState('');

  const { participations, fetchParticipations } = useCampaignStore();
  const {
    instagramAnalytics,
    youtubeAnalytics,
    twitterAnalytics,
    fetchInstagramAnalytics,
    fetchYouTubeAnalytics,
    fetchTwitterAnalytics,
  } = useInfluencerStore();
  const {
    isConnected: igHubConnected,
    connection: igConnection,
    fetchConnectionStatus,
  } = useInstagramAutomationStore();
  const [igMediaEngagement, setIgMediaEngagement] = useState(0);
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
    quota,
    fetchQuota,
  } = usePostAnalyzerStore();

  const quotaExhausted = quota != null && quota.remaining <= 0;
  const limitNotice =
    Boolean(dailyLimitError) ||
    Boolean(analyzeError && isPostAnalyzerDailyLimitError(analyzeError));
  const hardAnalyzeError =
    analyzeError && !isPostAnalyzerDailyLimitError(analyzeError) ? analyzeError : null;

  const loadScreenData = useCallback(async () => {
    await Promise.all([
      fetchHistory(undefined, 1),
      fetchQuota(),
      fetchParticipations(),
      fetchInstagramAnalytics(),
      fetchYouTubeAnalytics(),
      fetchTwitterAnalytics(),
      fetchConnectionStatus(),
    ]);
    const hub = useInstagramAutomationStore.getState();
    const followers = Math.max(0, hub.connection?.followerCount ?? 0);
    if (hub.isConnected && followers > 0) {
      try {
        const [reels, posts] = await Promise.all([
          instagramAutomationApi.listMedia('reels'),
          instagramAutomationApi.listMedia('posts'),
        ]);
        const items = [...(reels.items ?? []), ...(posts.items ?? [])];
        const rates = items
          .map((item) => {
            const eng = (item.likeCount ?? 0) + (item.commentCount ?? 0);
            return followers > 0 ? (eng / followers) * 100 : 0;
          })
          .filter((n) => Number.isFinite(n) && n > 0);
        setIgMediaEngagement(
          rates.length > 0 ? rates.reduce((sum, n) => sum + n, 0) / rates.length : 0
        );
      } catch {
        setIgMediaEngagement(0);
      }
    } else {
      setIgMediaEngagement(0);
    }
  }, [
    fetchHistory,
    fetchQuota,
    fetchParticipations,
    fetchInstagramAnalytics,
    fetchYouTubeAnalytics,
    fetchTwitterAnalytics,
    fetchConnectionStatus,
  ]);

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

  const igFollowers = Math.max(0, igConnection?.followerCount ?? 0);
  const phylloReach = sumConnectedFollowers(instagramAnalytics, youtubeAnalytics, twitterAnalytics);
  const totalReach = igHubConnected ? Math.max(igFollowers, phylloReach) : phylloReach;

  const avgEngagement = useMemo(() => {
    if (igHubConnected && igMediaEngagement > 0) return igMediaEngagement;
    const fromPosts = engagementFromAnalyzedPosts(history);
    if (fromPosts > 0) return fromPosts;
    return averageEngagementRate([instagramAnalytics, youtubeAnalytics, twitterAnalytics]);
  }, [
    igHubConnected,
    igMediaEngagement,
    history,
    instagramAnalytics,
    youtubeAnalytics,
    twitterAnalytics,
  ]);

  const hasConnectedInstagram = igHubConnected || audienceCount(instagramAnalytics) > 0;
  const collabs = participations.filter((p) => isParticipationEnrolled(p)).length;
  const canAnalyze = analyzeInput.trim().length > 0 && !isAnalyzing;
  const hasMore = history.length < historyTotal;

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScreenData();
    setRefreshing(false);
  };

  const runAnalyze = async () => {
    if (!canAnalyze) return;
    const url = analyzeInput.trim();
    const metrics = await analyzeUrl(url);
    const after = usePostAnalyzerStore.getState();
    const limitHit = Boolean(after.dailyLimitError);
    if (metrics || limitHit) setAnalyzeInput('');
    await Promise.all([fetchHistory(undefined, 1), fetchQuota()]);
  };

  return (
    <ScrollScreen
      padH={0}
      contentInsetBottom
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={kollab.color.ink}
          />
        ),
        contentContainerStyle: { flexGrow: 1, paddingBottom: 150 },
      }}
    >
      <View style={styles.headPad}>
        <KollabScreenHeader
          title="My stats"
          subtitle="Across connected accounts"
          showBack={false}
          size="tab"
        />
      </View>

      {hasConnectedInstagram ? (
        <View style={[styles.panel, { backgroundColor: kollab.color.panel }]}>
          <Text style={[styles.panelLabel, { color: kollab.color.panelInk }]}>Total Reach</Text>
          <Text style={[styles.panelValue, { color: kollab.color.panelInk }]}>
            {totalReach > 0 ? formatReachCount(totalReach) : '—'}
          </Text>
          <View style={styles.panelSplit}>
            <View style={styles.panelCell}>
              <Text style={[styles.panelSub, { color: kollab.color.panelInk }]}>
                avg engagement
              </Text>
              <Text style={[styles.panelMetric, { color: kollab.color.chartreuse }]}>
                {formatEr(avgEngagement)}
              </Text>
            </View>
            <View style={styles.panelCell}>
              <Text style={[styles.panelSub, { color: kollab.color.panelInk }]}>collabs</Text>
              <Text style={[styles.panelMetric, { color: kollab.color.panelInk }]}>{collabs}</Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={[styles.analyze, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
        <Text style={[styles.analyzeTitle, { color: kollab.color.ink }]}>Analyze post URL</Text>
        <Text style={[styles.analyzeHint, { color: kollab.color.ink }]}>
          Paste a post link to pull its metrics into your stats.
        </Text>
        {quota && !quotaExhausted && !isAnalyzing ? (
          <Text style={[styles.quotaLeft, { color: kollab.color.ink }]}>
            {quota.remaining} of {quota.limit} {quota.limit === 1 ? 'analysis' : 'analyses'} left
            today
          </Text>
        ) : null}
        <KollabTextField
          surface="well"
          value={analyzeInput}
          onChangeText={setAnalyzeInput}
          placeholder="https://instagram.com/p/..."
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isAnalyzing}
          style={styles.analyzeField}
        />
        {isAnalyzing ? (
          <KollabAnalyzePulse />
        ) : (
          <Pressable
            onPress={() => void runAnalyze()}
            disabled={!canAnalyze}
            style={[
              styles.analyzeBtn,
              {
                backgroundColor: canAnalyze ? kollab.color.panel : kollab.color.neutralChipBg,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canAnalyze }}
          >
            <Text
              style={[
                styles.analyzeBtnText,
                {
                  color: canAnalyze ? kollab.color.chartreuse : kollab.color.neutralChipFg,
                },
              ]}
            >
              Analyze
            </Text>
          </Pressable>
        )}
        {limitNotice && !isAnalyzing ? (
          <View style={[styles.limit, { backgroundColor: kollab.color.tint }]}>
            <Text style={[styles.limitTitle, { color: kollab.color.violetDeep }]}>
              Daily analysis limit reached
            </Text>
            <Text style={[styles.limitBody, { color: kollab.color.ink }]}>
              {quota
                ? `${quota.used} of ${quota.limit} used today. Your free analysis resets at midnight (UTC). Open a post you already analyzed — that does not use another slot.`
                : 'Your free analysis resets at midnight (UTC). You can still open posts you already analyzed today — that does not use another slot.'}
            </Text>
          </View>
        ) : null}
        {hardAnalyzeError ? (
          <Text style={[styles.error, { color: kollab.color.heat }]}>{hardAnalyzeError}</Text>
        ) : null}
      </View>

      {historyError ? (
        <View style={styles.errRow}>
          <Text style={[styles.error, { color: kollab.color.heat }]}>{historyError}</Text>
          <Pressable onPress={() => void fetchHistory(undefined, 1)}>
            <Text style={[styles.retry, { color: kollab.color.heat }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {initialLoading && history.length === 0 ? (
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 12 }} />
      ) : null}

      <KollabSectionLabel label="analyzed posts" style={styles.sectionLabel} />
      {history.length === 0 && !initialLoading ? (
        <Text style={[styles.empty, { color: kollab.color.ink }]}>No posts analyzed yet.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={styles.thumbs}
        >
          {history.map((item) => {
            const engLabel = formatEngPill(item.engagementRate);
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (item.url) void openExternalUrl(item.url);
                }}
                style={[
                  styles.thumbCard,
                  { backgroundColor: kollab.color.card },
                  kollab.shadow.card,
                ]}
              >
                <View style={[styles.thumb, { backgroundColor: kollab.color.imgBg }]}>
                  <AnalyzedPostThumb item={item} />
                  <LinearGradient
                    colors={kollab.scrimStops.tile.colors as [string, string]}
                    locations={kollab.scrimStops.tile.locations as [number, number]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {engLabel ? (
                    <View style={[styles.engPill, { backgroundColor: kollab.color.chartreuse }]}>
                      <Text style={[styles.engPillText, { color: kollab.color.onChartreuse }]}>
                        {engLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.thumbCopy}>
                  <Text style={[styles.thumbLikes, { color: kollab.color.ink }]}>
                    {formatCompactNumber(item.likes)} likes
                  </Text>
                  <Text style={[styles.thumbMeta, { color: kollab.color.ink }]} numberOfLines={1}>
                    {postMeta(item)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {hasMore ? (
            <Pressable
              onPress={() => void fetchHistory(undefined, historyPage + 1)}
              disabled={historyLoading}
              style={[styles.loadMore, { backgroundColor: kollab.color.card }]}
            >
              <Text style={[styles.loadMoreText, { color: kollab.color.ink }]}>
                {historyLoading ? 'Loading…' : 'Load more'}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </ScrollScreen>
  );
}

function useStyles(kollab: KollabTokens) {
  return useMemo(
    () =>
      StyleSheet.create({
        headPad: {
          paddingHorizontal: space.gutter,
          paddingTop: 2,
        },
        panel: {
          marginHorizontal: space.cardGutter,
          marginBottom: 14,
          borderRadius: 24,
          padding: 22,
        },
        panelLabel: {
          fontFamily: font.body,
          fontSize: 12,
          opacity: 0.6,
        },
        panelValue: {
          fontFamily: font.display,
          fontSize: 44,
          marginTop: 2,
          marginBottom: 16,
        },
        panelSplit: {
          flexDirection: 'row',
          gap: 14,
        },
        panelCell: { flex: 1 },
        panelSub: {
          fontFamily: font.body,
          fontSize: 11.5,
          opacity: 0.6,
        },
        panelMetric: {
          fontFamily: font.display,
          fontSize: 24,
          marginTop: 2,
        },
        engPill: {
          position: 'absolute',
          top: 9,
          left: 9,
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        engPillText: {
          fontFamily: font.bold,
          fontSize: 10.5,
        },
        analyze: {
          marginHorizontal: space.cardGutter,
          marginBottom: 18,
          borderRadius: 24,
          padding: 18,
        },
        analyzeTitle: {
          ...kType.sectionTitle,
        },
        analyzeHint: {
          fontFamily: font.body,
          fontSize: 12.5,
          opacity: 0.55,
          marginTop: 3,
          marginBottom: 8,
          lineHeight: 18,
        },
        quotaLeft: {
          fontFamily: font.semiBold,
          fontSize: 11.5,
          opacity: 0.55,
          marginBottom: 10,
        },
        analyzeField: { marginBottom: 10 },
        analyzeBtn: {
          borderRadius: 999,
          paddingVertical: 15,
          alignItems: 'center',
        },
        analyzeBtnText: {
          fontFamily: font.semiBold,
          fontSize: 14.5,
        },
        limit: {
          borderRadius: 18,
          paddingVertical: 15,
          paddingHorizontal: 16,
          marginTop: 12,
        },
        limitTitle: {
          fontFamily: font.semiBold,
          fontSize: 13,
        },
        limitBody: {
          fontFamily: font.body,
          fontSize: 12.5,
          lineHeight: 18.5,
          opacity: 0.65,
          marginTop: 4,
        },
        sectionLabel: {
          paddingHorizontal: space.gutter,
          marginBottom: 11,
        },
        thumbs: {
          gap: 12,
          paddingHorizontal: space.gutter,
          paddingBottom: 8,
        },
        thumbCard: {
          width: 150,
          borderRadius: 20,
          overflow: 'hidden',
        },
        thumb: {
          height: 150,
        },
        thumbCopy: {
          paddingVertical: 11,
          paddingHorizontal: 13,
          paddingBottom: 13,
        },
        thumbLikes: {
          fontFamily: font.semiBold,
          fontSize: 12.5,
        },
        thumbMeta: {
          fontFamily: font.body,
          fontSize: 11,
          opacity: 0.55,
          marginTop: 3,
        },
        loadMore: {
          width: 150,
          height: 210,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
        },
        loadMoreText: {
          fontFamily: font.semiBold,
          fontSize: 13,
        },
        empty: {
          fontFamily: font.body,
          fontSize: 13,
          opacity: 0.55,
          paddingHorizontal: space.gutter,
          marginBottom: 14,
          lineHeight: 19,
        },
        error: {
          fontFamily: font.body,
          fontSize: 12.5,
          flex: 1,
        },
        errRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: space.gutter,
          marginBottom: 12,
        },
        retry: {
          fontFamily: font.semiBold,
          fontSize: 12.5,
        },
      }),
    [kollab]
  );
}
