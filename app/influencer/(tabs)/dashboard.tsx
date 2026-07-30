import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfluencerStore } from '@/store/influencer-store';
import { useCampaignStore } from '@/store/campaign-store';
import { useAuthStore } from '@/store/auth-store';
import { useInstagramAutomationStore } from '@/store/instagram-automation-store';
import { useThemeStore } from '@/store/theme-store';
import { useCatalogStore } from '@/store/catalog-store';
import { instagramAutomationApi } from '@/lib/instagram-automation-api';
import { api } from '@/lib/api';
import {
  ScrollScreen,
  HomeReferenceHeroCard,
  HomeQuickSetupSection,
  HomeNotificationBell,
  HomeMyCampaignsAccordion,
  HomeEarningsSummary,
  HomeCampaignProgressCard,
  HomeCatalogPreviewCard,
  HomeGettingStartedCard,
  showPremiumToast,
} from '@/components/ui';
import type { GettingStartedItem, HomeQuickSetupStep } from '@/components/ui';
import { buildHomeDashboardStats } from '@/lib/home-dashboard-stats';
import {
  getActiveParticipations,
  isExistingCampaignUser,
  participationCampaignId,
  participationCampaignName,
} from '@/lib/home-existing-user';
import { sumPotentialEarningsFromEligible } from '@/lib/home-potential-earnings';
import {
  isCreateProductsDone,
  isPriceCardDone,
  isRateCalculatorVisited,
  isTrendingIdeasVisited,
  markRateCalculatorVisited,
  markTrendingIdeasVisited,
} from '@/lib/home-quick-setup-done';
import { rateCardsApi } from '@/lib/rate-cards-api';
import { appShell, spacing } from '@/theme';
import { useAppShell } from '@/theme/useAppShell';
import { fonts } from '@/components/ui/typography';

function formatHandle(raw?: string | null): string | null {
  const cleaned = raw?.trim().replace(/^@+/, '') ?? '';
  return cleaned || null;
}

function refreshInstagramConnectionStatus() {
  return instagramAutomationApi
    .getConnectionStatus()
    .then((res) => {
      useInstagramAutomationStore.setState({
        isConnected: res.connected,
        connection: res.connection ?? null,
      });
    })
    .catch(() => {
      /* Home CTA falls back to Connect accounts */
    });
}

export default function InfluencerDashboard() {
  const router = useRouter();
  const shell = useAppShell();
  const appearance = useThemeStore((s) => s.appearance);
  const setAppearance = useThemeStore((s) => s.setAppearance);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const username = useAuthStore((s) => s.user?.username);
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const handle = useMemo(() => formatHandle(username), [username]);
  const avatarLetter = useMemo(() => (handle ? handle.slice(0, 1).toUpperCase() : '•'), [handle]);
  const {
    isLoading,
    error,
    isConnected,
    isYtConnected,
    isTwitterConnected,
    instagramAnalytics,
    youtubeAnalytics,
    twitterAnalytics,
    fetchInstagramAnalytics,
    fetchYouTubeAnalytics,
    fetchTwitterAnalytics,
    clearError,
  } = useInfluencerStore();
  const {
    campaigns,
    participations,
    fetchCampaigns,
    fetchParticipations,
    fetchNotifications,
    unreadNotifications,
  } = useCampaignStore();
  const igConnected = useInstagramAutomationStore((s) => s.isConnected);
  const { catalog, isLoading: catalogLoading, fetchMyCatalog } = useCatalogStore();

  const [analyticsReady, setAnalyticsReady] = useState(false);
  const [paidTotal, setPaidTotal] = useState(0);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [priceCardDone, setPriceCardDone] = useState(false);
  const [rateCalculatorVisited, setRateCalculatorVisited] = useState(false);
  const [trendingVisited, setTrendingVisited] = useState(false);

  useEffect(() => {
    void hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchInstagramAnalytics(),
      fetchYouTubeAnalytics(),
      fetchTwitterAnalytics(),
      refreshInstagramConnectionStatus(),
      refreshSession(),
      fetchParticipations(),
      fetchCampaigns(),
    ]).finally(() => {
      if (!cancelled) setAnalyticsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [
    fetchInstagramAnalytics,
    fetchYouTubeAnalytics,
    fetchTwitterAnalytics,
    refreshSession,
    fetchParticipations,
    fetchCampaigns,
  ]);

  const isExistingUser = useMemo(() => isExistingCampaignUser(participations), [participations]);

  useFocusEffect(
    useCallback(() => {
      void refreshInstagramConnectionStatus();
      void refreshSession({ logoutOnUnauthorized: false });
      void fetchNotifications();
      void fetchParticipations();
      void fetchCampaigns();
      void fetchMyCatalog().catch(() => {
        /* catalog optional for new users */
      });

      let cancelled = false;
      if (!isExistingUser) {
        void (rateCardsApi.getMy() as Promise<{ rateCard?: Record<string, unknown> }>)
          .then((res) => {
            if (!cancelled) setPriceCardDone(isPriceCardDone(res?.rateCard));
          })
          .catch(() => {
            if (!cancelled) setPriceCardDone(false);
          });
        void Promise.all([isRateCalculatorVisited(), isTrendingIdeasVisited()]).then(
          ([rateVisited, ideasVisited]) => {
            if (!cancelled) {
              setRateCalculatorVisited(rateVisited);
              setTrendingVisited(ideasVisited);
            }
          }
        );
      }

      return () => {
        cancelled = true;
      };
    }, [
      refreshSession,
      fetchNotifications,
      fetchParticipations,
      fetchCampaigns,
      fetchMyCatalog,
      isExistingUser,
    ])
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!error) return;
    Alert.alert('Error', error);
    const timer = setTimeout(() => clearError(), 5000);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  const activeParticipations = useMemo(
    () => getActiveParticipations(participations),
    [participations]
  );

  useEffect(() => {
    if (!isExistingUser) {
      setPaidTotal(0);
      return;
    }
    let cancelled = false;
    setEarningsLoading(true);
    void (
      api.get('/api/payments/influencer/my') as Promise<{
        summary?: { paidTotal?: number };
      }>
    )
      .then((res) => {
        if (!cancelled) setPaidTotal(Number(res?.summary?.paidTotal ?? 0));
      })
      .catch(() => {
        if (!cancelled) setPaidTotal(0);
      })
      .finally(() => {
        if (!cancelled) setEarningsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isExistingUser, participations.length]);

  const enrolledIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of participations) {
      const id = participationCampaignId(p).toLowerCase();
      if (id) ids.add(id);
    }
    return ids;
  }, [participations]);

  const potentialEarnings = useMemo(
    () =>
      sumPotentialEarningsFromEligible({
        campaigns,
        enrolledCampaignIds: enrolledIds,
      }),
    [campaigns, enrolledIds]
  );

  const stats = useMemo(
    () =>
      buildHomeDashboardStats({
        instagramAnalytics,
        youtubeAnalytics,
        twitterAnalytics,
        participations,
        hasLoadedParticipations: analyticsReady,
        hasLoadedAnalytics: analyticsReady,
      }),
    [instagramAnalytics, youtubeAnalytics, twitterAnalytics, participations, analyticsReady]
  );

  const hasAnySocialConnected = isConnected || isYtConnected || isTwitterConnected || igConnected;

  const createProductsDone = useMemo(() => isCreateProductsDone(catalog), [catalog]);

  const quickSetupSteps = useMemo((): HomeQuickSetupStep[] => {
    const steps: HomeQuickSetupStep[] = [];

    // Setup tools only while not enrolled — soft-hide when done
    if (!isExistingUser) {
      if (!priceCardDone) {
        steps.push({
          key: 'priceCard',
          title: 'Price Card',
          description: 'Set your prices for brands',
          variant: 'priceCard',
          onPress: () => router.push('/account-screens/rate-card' as never),
        });
      }
      if (!rateCalculatorVisited) {
        steps.push({
          key: 'rateCalculator',
          title: 'Rate Calculator',
          description: 'Verify your promotion pricing',
          variant: 'rateCalculator',
          onPress: () => {
            void markRateCalculatorVisited().then(() => setRateCalculatorVisited(true));
            router.push('/account-screens/rate-calculator' as never);
          },
        });
      }
    }

    // Trending always
    steps.push({
      key: 'trending',
      title: 'Trending Ideas',
      description: 'Content hooks worth posting',
      variant: 'trending',
      onPress: () => {
        void markTrendingIdeasVisited().then(() => setTrendingVisited(true));
        router.push('/account-screens/trending-ideas');
      },
    });

    if (!isExistingUser && !createProductsDone) {
      steps.push({
        key: 'createProducts',
        title: 'Create Products',
        description: 'Create your own business catalog',
        variant: 'createProducts',
        onPress: () => router.push('/account-screens/catalog' as never),
      });
    }

    // IG automation — new or existing (immediate when connected)
    if (igConnected) {
      steps.push(
        {
          key: 'schedule',
          title: 'Schedule Content',
          description: 'Plan posts ahead',
          variant: 'schedule',
          onPress: () => router.push('/account-screens/schedule-content' as never),
        },
        {
          key: 'autoDm',
          title: 'Auto DM',
          description: 'Automate replies',
          variant: 'autoDm',
          onPress: () => router.push('/account-screens/dm-automation' as never),
        }
      );
    }

    return steps;
  }, [
    router,
    igConnected,
    isExistingUser,
    priceCardDone,
    rateCalculatorVisited,
    createProductsDone,
  ]);

  const hasSetupTiles = useMemo(
    () =>
      !isExistingUser &&
      quickSetupSteps.some((s) =>
        ['priceCard', 'rateCalculator', 'createProducts'].includes(s.key)
      ),
    [isExistingUser, quickSetupSteps]
  );

  const quickSectionTitle = hasSetupTiles ? 'Quick Setup' : 'Quick Actions';
  const quickSectionSubtitle = hasSetupTiles
    ? 'Complete these steps to become campaign-ready.'
    : null;

  const gettingStartedItems = useMemo((): GettingStartedItem[] => {
    if (isExistingUser) return [];
    return [
      { key: 'priceCard', title: 'Price Card', done: priceCardDone },
      { key: 'rateCalculator', title: 'Rate Calculator', done: rateCalculatorVisited },
      { key: 'trending', title: 'Trending Ideas', done: trendingVisited },
      { key: 'createProducts', title: 'Create Products', done: createProductsDone },
    ];
  }, [isExistingUser, priceCardDone, rateCalculatorVisited, trendingVisited, createProductsDone]);

  const setupAllDone = useMemo(
    () =>
      !isExistingUser && gettingStartedItems.length > 0 && gettingStartedItems.every((i) => i.done),
    [isExistingUser, gettingStartedItems]
  );

  const progressItems = useMemo(() => {
    return [...activeParticipations]
      .sort((a, b) => {
        const ta = new Date(a.joinedAt || 0).getTime();
        const tb = new Date(b.joinedAt || 0).getTime();
        return tb - ta;
      })
      .map((p) => {
        const campaignId = participationCampaignId(p);
        return {
          participationId: p.id,
          campaignId,
          campaignName: participationCampaignName(p),
        };
      })
      .filter((x) => Boolean(x.participationId && x.campaignId));
  }, [activeParticipations]);

  const openMineTab = useCallback(() => {
    router.push('/influencer/campaigns?segment=mine' as never);
  }, [router]);

  const openCampaignProgress = useCallback(
    (campaignId: string, participationId: string) => {
      router.push(
        `/influencer/campaign-progress?participationId=${encodeURIComponent(participationId)}&campaignId=${encodeURIComponent(campaignId)}` as never
      );
    },
    [router]
  );

  const handleThemeToggle = useCallback(async () => {
    const next = appearance === 'dark' ? 'light' : 'dark';
    await setAppearance(next);
    showPremiumToast({
      title: next === 'dark' ? 'Dark theme' : 'Light theme',
      message:
        next === 'dark'
          ? 'Premium dark canvas applied across the app.'
          : 'Light canvas restored across the app.',
      durationMs: 2200,
    });
  }, [appearance, setAppearance]);

  const pageHeader = (
    <View style={styles.pageHeader}>
      <Text style={[styles.pageTitle, { color: shell.textPrimary }]}>Home</Text>
      <View style={styles.headerActions}>
        <Pressable
          style={[
            styles.themeToggle,
            {
              backgroundColor: shell.card,
              borderColor: shell.cardBorder,
            },
          ]}
          onPress={() => void handleThemeToggle()}
          accessibilityRole="button"
          accessibilityLabel={
            appearance === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
          }
        >
          <Ionicons
            name={appearance === 'dark' ? 'sunny-outline' : 'moon-outline'}
            size={20}
            color={shell.cta}
          />
        </Pressable>
        <HomeNotificationBell
          unreadCount={unreadNotifications}
          onPress={() => router.push('/influencer/invites')}
        />
      </View>
    </View>
  );

  if (isLoading && !hasAnySocialConnected && !analyticsReady) {
    return (
      <ScrollScreen
        dotBackground={false}
        canvasColor={shell.canvas}
        contentInsetBottom
        scrollProps={{
          bounces: true,
          overScrollMode: 'always',
          contentContainerStyle: { flexGrow: 0 },
        }}
      >
        {pageHeader}
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={shell.cta} />
          <Text style={[styles.loadingText, { color: shell.textSecondary }]}>
            Loading your overview
          </Text>
        </View>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen
      dotBackground={false}
      canvasColor={shell.canvas}
      contentInsetBottom
      scrollProps={{
        bounces: true,
        overScrollMode: 'always',
        nestedScrollEnabled: true,
        contentContainerStyle: { flexGrow: 0 },
      }}
    >
      <View style={styles.stack}>
        {pageHeader}

        {handle ? (
          <View style={styles.identityRow}>
            <View style={[styles.identityMark, { backgroundColor: shell.cta }]}>
              <Text style={styles.identityMarkText}>{avatarLetter}</Text>
            </View>
            <View style={styles.identityCopy}>
              <Text style={[styles.identityEyebrow, { color: shell.textSecondary }]}>
                Welcome !
              </Text>
              <Text style={[styles.identityHandle, { color: shell.textPrimary }]} numberOfLines={1}>
                {handle}
              </Text>
            </View>
          </View>
        ) : null}

        {isExistingUser ? (
          <HomeEarningsSummary
            style={styles.section}
            myEarnings={paidTotal}
            potentialEarnings={potentialEarnings}
            loading={earningsLoading}
            onPressMyEarnings={() => router.push('/account-screens/payments' as never)}
            onPressPotential={() => router.push('/influencer/campaigns' as never)}
          />
        ) : (
          <HomeReferenceHeroCard
            style={styles.section}
            totalReach={stats.totalReach}
            hasReach={stats.hasReach}
            accountsConnected={hasAnySocialConnected}
            onDetailsPress={() =>
              router.push(
                stats.hasReach ? '/influencer/my-stats' : '/account-screens/instagram-hub'
              )
            }
          />
        )}

        {!isExistingUser && !setupAllDone ? (
          <HomeGettingStartedCard style={styles.section} items={gettingStartedItems} />
        ) : null}

        <HomeQuickSetupSection
          style={isExistingUser ? styles.section : styles.sectionLast}
          steps={quickSetupSteps}
          variant="adaptive"
          title={quickSectionTitle}
          subtitle={quickSectionSubtitle}
        />

        {isExistingUser ? (
          <>
            <HomeMyCampaignsAccordion
              style={styles.section}
              activeCount={activeParticipations.length}
              onPress={openMineTab}
            />

            <HomeCampaignProgressCard
              style={styles.section}
              items={progressItems}
              onPress={openCampaignProgress}
            />

            <HomeCatalogPreviewCard
              style={styles.sectionLast}
              catalog={catalog}
              loading={catalogLoading}
              onOpenCatalog={() => router.push('/account-screens/catalog' as never)}
            />
          </>
        ) : null}
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: '100%',
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appShell.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
  },
  pageTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: appShell.textPrimary,
    letterSpacing: -0.2,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
    paddingRight: 4,
  },
  identityMark: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appShell.cta,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  identityMarkText: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 26,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
  },
  identityEyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    letterSpacing: 0.2,
    color: appShell.textSecondary,
  },
  identityHandle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 28,
    color: appShell.textPrimary,
    letterSpacing: -0.55,
  },
  section: {
    marginBottom: 0,
  },
  sectionLast: {
    marginBottom: 0,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: appShell.textSecondary,
    fontFamily: fonts.regular,
  },
});
