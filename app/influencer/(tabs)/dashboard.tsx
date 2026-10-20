import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useInfluencerStore } from '@/store/influencer-store';
import { useCampaignStore } from '@/store/campaign-store';
import { useAuthStore } from '@/store/auth-store';
import { useThemeStore } from '@/store/theme-store';
import { useCatalogStore } from '@/store/catalog-store';
import { api } from '@/lib/api';
import {
  ScrollScreen,
  HomeHeaderBar,
  HomeEarningsPair,
  HomeStorefrontCard,
  HomeProfileCompletionCard,
  HomeCampaignsSection,
  HomeFreshCollabsRail,
  showKollabToast,
} from '@/components/ui';
import { CampaignDetailsModal } from '@/components/influencer/CampaignDetailsModal';
import {
  getActiveParticipations,
  participationCampaignId,
  participationCampaignName,
} from '@/lib/home-existing-user';
import { isParticipationEnrolled, applicationCampaignId } from '@/lib/campaign-participation-ui';
import { sumPotentialEarningsFromEligible } from '@/lib/home-potential-earnings';
import { computeProfileCompletion, type ProfileForCompletion } from '@/lib/profile-completion';
import { useKollab, space as kollabSpace, font } from '@/theme/kollab-tokens';

function formatHandle(raw?: string | null): string | null {
  const cleaned = raw?.trim().replace(/^@+/, '') ?? '';
  return cleaned || null;
}

export default function InfluencerDashboard() {
  const router = useRouter();
  const kollab = useKollab();
  const appearance = useThemeStore((s) => s.appearance);
  const setAppearance = useThemeStore((s) => s.setAppearance);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const username = useAuthStore((s) => s.user?.username);
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const handle = useMemo(() => formatHandle(username), [username]);
  const avatarLetter = useMemo(() => (handle ? handle.slice(0, 1).toUpperCase() : '•'), [handle]);
  const {
    error,
    fetchInstagramAnalytics,
    fetchYouTubeAnalytics,
    fetchTwitterAnalytics,
    clearError,
  } = useInfluencerStore();
  const {
    campaigns,
    participations,
    applications,
    fetchCampaigns,
    fetchParticipations,
    fetchNotifications,
    fetchMyApplications,
    unreadNotifications,
  } = useCampaignStore();
  const { catalogs, fetchMyCatalog } = useCatalogStore();

  const [ready, setReady] = useState(false);
  const [paidTotal, setPaidTotal] = useState(0);
  const [profileForCompletion, setProfileForCompletion] = useState<ProfileForCompletion | null>(
    null
  );
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  useEffect(() => {
    void hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchInstagramAnalytics(),
      fetchYouTubeAnalytics(),
      fetchTwitterAnalytics(),
      refreshSession(),
      fetchParticipations(),
      fetchCampaigns(),
      fetchMyApplications(),
    ]).finally(() => {
      if (!cancelled) setReady(true);
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
    fetchMyApplications,
  ]);

  useFocusEffect(
    useCallback(() => {
      void refreshSession({ logoutOnUnauthorized: false });
      void fetchNotifications();
      void fetchParticipations();
      void fetchCampaigns();
      void fetchMyApplications();
      void fetchMyCatalog('products').catch(() => {
        /* catalog optional */
      });
      void fetchMyCatalog('services').catch(() => {
        /* catalog optional */
      });
      void (api.get('/api/influencers/profile') as Promise<ProfileForCompletion>)
        .then((p) => setProfileForCompletion(p))
        .catch(() => {
          /* the completion card just stays hidden */
        });
    }, [
      refreshSession,
      fetchNotifications,
      fetchParticipations,
      fetchCampaigns,
      fetchMyApplications,
      fetchMyCatalog,
    ])
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!error) return;
    showKollabToast(error);
    const timer = setTimeout(() => clearError(), 5000);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  useEffect(() => {
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
  }, [participations.length]);

  const enrolledIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of participations) {
      const id = participationCampaignId(p).toLowerCase();
      if (id && isParticipationEnrolled(p)) ids.add(id);
    }
    return ids;
  }, [participations]);

  const takenCampaignIds = useMemo(() => {
    const ids = new Set<string>();
    const names = new Set<string>();
    for (const p of participations) {
      const id = participationCampaignId(p).toLowerCase();
      if (id) ids.add(id);
      const n = participationCampaignName(p).trim().toLowerCase();
      if (n) names.add(n);
    }
    for (const a of applications) {
      const st = String(a.status ?? '')
        .trim()
        .toLowerCase();
      if (st === 'rejected') continue;
      const id = applicationCampaignId(a);
      if (id) ids.add(id);
      const nestedName = String(a.campaign?.name ?? '')
        .trim()
        .toLowerCase();
      if (nestedName) names.add(nestedName);
      const listed = campaigns.find((c) => String(c.id).trim().toLowerCase() === id);
      const listedName = String(listed?.name ?? '')
        .trim()
        .toLowerCase();
      if (listedName) names.add(listedName);
    }
    return { ids, names };
  }, [applications, campaigns, participations]);

  const potentialEarnings = useMemo(
    () =>
      sumPotentialEarningsFromEligible({
        campaigns,
        enrolledCampaignIds: enrolledIds,
      }),
    [campaigns, enrolledIds]
  );

  const freshCollabs = useMemo(
    () =>
      campaigns.filter((c) => {
        const id = String(c.id ?? '')
          .trim()
          .toLowerCase();
        if (!id) return false;
        if (String(c.status ?? '').toLowerCase() !== 'active') return false;
        const name = String(c.name ?? '')
          .trim()
          .toLowerCase();
        if (takenCampaignIds.ids.has(id)) return false;
        if (name && takenCampaignIds.names.has(name)) return false;
        return true;
      }),
    [campaigns, takenCampaignIds]
  );

  const progressItems = useMemo(() => {
    return [...getActiveParticipations(participations)]
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
  }, [participations]);

  const pageHeader = (
    <HomeHeaderBar
      avatarLetter={handle ? avatarLetter : null}
      name={handle}
      isDark={appearance === 'dark'}
      hasUnread={unreadNotifications > 0}
      onToggleTheme={() => void setAppearance(appearance === 'dark' ? 'light' : 'dark')}
      onPressNotifications={() => router.push('/influencer/inbox' as never)}
    />
  );

  if (!ready) {
    return (
      <ScrollScreen
        padH={0}
        canvasColor={kollab.color.screen}
        contentInsetBottom
        scrollProps={{ contentContainerStyle: { flexGrow: 0 } }}
      >
        {pageHeader}
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={kollab.color.ink} />
          <Text style={[styles.loadingText, { color: kollab.color.inkMuted }]}>
            Loading your overview
          </Text>
        </View>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen
      padH={0}
      canvasColor={kollab.color.screen}
      contentInsetBottom
      scrollProps={{
        bounces: true,
        overScrollMode: 'always',
        nestedScrollEnabled: true,
        showsVerticalScrollIndicator: false,
        contentContainerStyle: { flexGrow: 0 },
      }}
    >
      {pageHeader}

      {profileForCompletion ? (
        <HomeProfileCompletionCard
          completion={computeProfileCompletion(profileForCompletion)}
          onPress={() => router.push('/account-screens/settings' as never)}
        />
      ) : null}

      <HomeEarningsPair
        myEarnings={paidTotal}
        potentialEarnings={potentialEarnings}
        loading={earningsLoading}
        onPressMyEarnings={() => router.push('/account-screens/payments' as never)}
        onPressPotential={() => router.push('/influencer/campaigns' as never)}
        style={{ paddingTop: 8 }}
      />

      {freshCollabs.length > 0 ? (
        <HomeFreshCollabsRail
          campaigns={freshCollabs}
          onOpenCampaign={(campaignId) => setSelectedCampaignId(campaignId)}
        />
      ) : null}

      {progressItems.length > 0 ? (
        <HomeCampaignsSection
          items={progressItems}
          activeCount={progressItems.length}
          onOpenCampaign={(campaignId, participationId) =>
            router.push(
              `/influencer/campaign-progress?participationId=${encodeURIComponent(participationId)}&campaignId=${encodeURIComponent(campaignId)}` as never
            )
          }
          onOpenAll={() => router.push('/influencer/campaigns' as never)}
        />
      ) : null}

      <HomeStorefrontCard
        productsCatalog={catalogs.products}
        servicesCatalog={catalogs.services}
        onOpenCatalog={() => router.push('/account-screens/catalog' as never)}
      />
      <CampaignDetailsModal
        campaignId={selectedCampaignId}
        onClose={() => {
          setSelectedCampaignId(null);
          void fetchParticipations();
          void fetchMyApplications();
        }}
        onBrowseMore={() => {
          void fetchParticipations();
          void fetchMyApplications();
        }}
        onApplySuccess={() => {
          void fetchParticipations();
          void fetchMyApplications();
        }}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: kollabSpace.sm,
    fontSize: 14,
    fontFamily: font.body,
  },
});
