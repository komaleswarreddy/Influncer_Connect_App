import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useInfluencerStore } from '@/store/influencer-store';
import { useCampaignStore } from '@/store/campaign-store';
import { useAuthStore } from '@/store/auth-store';
import { useInstagramAutomationStore } from '@/store/instagram-automation-store';
import { useThemeStore } from '@/store/theme-store';
import { useCatalogStore } from '@/store/catalog-store';
import { isCatalogSetupComplete } from '@/lib/catalog-api';
import { instagramAutomationApi } from '@/lib/instagram-automation-api';
import { api } from '@/lib/api';
import {
  ScrollScreen,
  HomeReferenceHeroCard,
  HomeLinkAccountsCta,
  HomeHeaderBar,
  HomeEarningsPair,
  HomeActionOrbs,
  HomeSectionLabel,
  HomeStorefrontCard,
  HomeCampaignsSection,
  HomeGettingStartedCard,
  showPremiumToast,
} from '@/components/ui';
import type {
  GettingStartedItem,
  HomeQuickSetupStep,
  HomeActionOrb,
  HomeActionOrbGlyph,
  StorefrontTabKey,
} from '@/components/ui';
import { useHomeDesign } from '@/theme/homeDesign';
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
  purgeLegacyQuickSetupFlags,
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

/** Maps an existing quick-setup step onto the mock's orb glyph set. */
const ORB_GLYPH: Record<string, HomeActionOrbGlyph> = {
  trending: 'trends',
  schedule: 'schedule',
  autoDm: 'autoDm',
  priceCard: 'priceCard',
  rateCalculator: 'rateCalculator',
  createProducts: 'storefront',
};

export default function InfluencerDashboard() {
  const router = useRouter();
  const shell = useAppShell();
  const home = useHomeDesign();
  const appearance = useThemeStore((s) => s.appearance);
  const setAppearance = useThemeStore((s) => s.setAppearance);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const username = useAuthStore((s) => s.user?.username);
  const userId = useAuthStore((s) => s.user?.id);
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const handle = useMemo(() => formatHandle(username), [username]);
  const avatarLetter = useMemo(() => (handle ? handle.slice(0, 1).toUpperCase() : '•'), [handle]);
  const {
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
  const { catalogs, isLoading: catalogLoadingByKind, fetchMyCatalog } = useCatalogStore();
  // Quick-setup "done" checklist counts either catalog kind as having started.
  const catalog = isCatalogSetupComplete(catalogs.products) ? catalogs.products : catalogs.services;

  const [analyticsReady, setAnalyticsReady] = useState(false);
  const [paidTotal, setPaidTotal] = useState(0);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [priceCardDone, setPriceCardDone] = useState(false);
  const [rateCalculatorVisited, setRateCalculatorVisited] = useState(false);
  const [trendingVisited, setTrendingVisited] = useState(false);

  useEffect(() => {
    void hydrateTheme();
  }, [hydrateTheme]);

  // Drop the pre-scoping device-global quick-setup flags so they can't leak between accounts.
  useEffect(() => {
    void purgeLegacyQuickSetupFlags();
  }, []);

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
      void fetchMyCatalog('products').catch(() => {
        /* catalog optional for new users */
      });
      void fetchMyCatalog('services').catch(() => {
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
        void Promise.all([isRateCalculatorVisited(userId), isTrendingIdeasVisited(userId)]).then(
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
      userId,
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
  /** Hero stays until Instagram is linked; then earnings replaces it. */
  const instagramLinked = isConnected || igConnected;

  const createProductsDone = useMemo(() => isCreateProductsDone(catalog), [catalog]);

  const quickSetupSteps = useMemo((): HomeQuickSetupStep[] => {
    const steps: HomeQuickSetupStep[] = [];

    // Setup tools only while not enrolled — soft-hide when done
    if (!isExistingUser) {
      if (!priceCardDone) {
        steps.push({
          key: 'priceCard',
          title: 'Price Card',
          variant: 'priceCard',
          onPress: () => router.push('/account-screens/rate-card' as never),
        });
      }
      if (!rateCalculatorVisited) {
        steps.push({
          key: 'rateCalculator',
          title: 'Rate Calculator',
          variant: 'rateCalculator',
          onPress: () => {
            void markRateCalculatorVisited(userId).then(() => setRateCalculatorVisited(true));
            router.push('/account-screens/rate-calculator' as never);
          },
        });
      }
    }

    // Trending always
    steps.push({
      key: 'trending',
      title: 'Trends',
      variant: 'trending',
      onPress: () => {
        void markTrendingIdeasVisited(userId).then(() => setTrendingVisited(true));
        router.push('/account-screens/trending-ideas');
      },
    });

    if (!isExistingUser && !createProductsDone) {
      steps.push({
        key: 'createProducts',
        title: 'My Storefront',
        variant: 'createProducts',
        onPress: () => router.push('/account-screens/catalog' as never),
      });
    }

    // IG automation — new or existing (immediate when connected)
    if (igConnected) {
      steps.push(
        {
          key: 'schedule',
          title: 'Schedule',
          variant: 'schedule',
          onPress: () => router.push('/account-screens/schedule-content' as never),
        },
        {
          key: 'autoDm',
          title: 'Auto DM',
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
    userId,
  ]);

  const hasSetupTiles = useMemo(
    () =>
      !isExistingUser &&
      quickSetupSteps.some((s) =>
        ['priceCard', 'rateCalculator', 'createProducts'].includes(s.key)
      ),
    [isExistingUser, quickSetupSteps]
  );

  const quickSectionTitle = hasSetupTiles ? 'Quick Setup' : null;

  const gettingStartedItems = useMemo((): GettingStartedItem[] => {
    if (isExistingUser) return [];
    return [
      { key: 'priceCard', title: 'Price Card', done: priceCardDone },
      { key: 'rateCalculator', title: 'Rate Calculator', done: rateCalculatorVisited },
      { key: 'trending', title: 'Trends', done: trendingVisited },
      { key: 'createProducts', title: 'My Storefront', done: createProductsDone },
    ];
  }, [isExistingUser, priceCardDone, rateCalculatorVisited, trendingVisited, createProductsDone]);

  const setupAllDone = useMemo(
    () =>
      !isExistingUser && gettingStartedItems.length > 0 && gettingStartedItems.every((i) => i.done),
    [isExistingUser, gettingStartedItems]
  );

  /** Post-setup / enrolled: show workspace modules so Home isn't empty. */
  const showWorkspace = isExistingUser || setupAllDone;
  const productsCatalogStarted = isCatalogSetupComplete(catalogs.products);
  const servicesCatalogStarted = isCatalogSetupComplete(catalogs.services);
  /** Show storefront preview as soon as a catalog exists — not only after full workspace unlock. */
  const showCatalogPreview = productsCatalogStarted || servicesCatalogStarted;
  const [catalogTab, setCatalogTab] = useState<'products' | 'services'>('products');

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
    <HomeHeaderBar
      avatarLetter={handle ? avatarLetter : null}
      name={handle}
      isDark={appearance === 'dark'}
      hasUnread={unreadNotifications > 0}
      onToggleTheme={() => void handleThemeToggle()}
      onPressNotifications={() => router.push('/influencer/invites')}
    />
  );

  const actionOrbs = useMemo<HomeActionOrb[]>(
    () =>
      quickSetupSteps.map((step) => ({
        key: step.key,
        label: step.title,
        glyph: ORB_GLYPH[step.variant] ?? 'trends',
        onPress: step.onPress,
      })),
    [quickSetupSteps]
  );

  const storefrontTabs = useMemo<StorefrontTabKey[]>(() => {
    const tabs: StorefrontTabKey[] = [];
    if (productsCatalogStarted) tabs.push('products');
    if (servicesCatalogStarted) tabs.push('services');
    return tabs;
  }, [productsCatalogStarted, servicesCatalogStarted]);

  /** Fall back to whichever catalog actually exists so the card never renders empty. */
  const effectiveStorefrontTab: StorefrontTabKey = storefrontTabs.includes(catalogTab)
    ? catalogTab
    : (storefrontTabs[0] ?? 'products');

  // Gate on the initial fetch batch (analytics + participations + campaigns)
  // finishing, not on whether a social account happens to already be
  // connected from a prior session — otherwise a returning user with a
  // connected account flashes ₹0 earnings / "no active campaigns" while that
  // same batch is still in flight (a false empty state, not a real one).
  if (!analyticsReady) {
    return (
      <ScrollScreen
        dotBackground={false}
        canvasColor={home.bg}
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
      canvasColor={home.bg}
      contentInsetBottom
      scrollProps={{
        bounces: true,
        overScrollMode: 'always',
        nestedScrollEnabled: true,
        showsVerticalScrollIndicator: false,
        contentContainerStyle: { flexGrow: 0 },
      }}
    >
      <View style={styles.stack}>
        {pageHeader}

        {showWorkspace ? (
          <HomeEarningsPair
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

        {actionOrbs.length > 0 ? (
          <View style={styles.orbsSection}>
            {quickSectionTitle ? <HomeSectionLabel label={quickSectionTitle} /> : null}
            <HomeActionOrbs actions={actionOrbs} />
            {!instagramLinked && actionOrbs.length === 1 && actionOrbs[0]?.key === 'trending' ? (
              <HomeLinkAccountsCta
                onPress={() => router.push('/account-screens/instagram-hub' as never)}
              />
            ) : null}
          </View>
        ) : null}

        {showCatalogPreview ? (
          <HomeStorefrontCard
            style={showWorkspace ? styles.section : styles.sectionLast}
            catalog={effectiveStorefrontTab === 'services' ? catalogs.services : catalogs.products}
            loading={
              effectiveStorefrontTab === 'services'
                ? catalogLoadingByKind.services
                : catalogLoadingByKind.products
            }
            availableTabs={storefrontTabs}
            activeTab={effectiveStorefrontTab}
            onChangeTab={setCatalogTab}
            onOpenCatalog={() => router.push('/account-screens/catalog' as never)}
          />
        ) : null}

        {showWorkspace && progressItems.length > 0 ? (
          <HomeCampaignsSection
            style={styles.sectionLast}
            items={progressItems}
            activeCount={activeParticipations.length}
            onOpenCampaign={openCampaignProgress}
            onOpenAll={openMineTab}
          />
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
  orbsSection: {
    marginTop: spacing.xs,
    marginBottom: 0,
  },
  section: {
    marginBottom: 0,
  },
  sectionLast: {
    marginBottom: 0,
  },
  catalogTabBar: {
    marginBottom: spacing.md,
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
