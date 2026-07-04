import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useInfluencerStore } from '@/store/influencer-store';
import { useCampaignStore } from '@/store/campaign-store';
import {
  ScrollScreen,
  HomeReferenceHeroCard,
  HomeCampaignHealthCard,
  HomeInvitesCard,
} from '@/components/ui';
import { buildHomeDashboardStats } from '@/lib/home-dashboard-stats';
import { appShell, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';

const HOME_CANVAS = '#F3F4F6';

export default function InfluencerDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
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
  const { fetchNotifications, fetchParticipations, unreadNotifications, participations } =
    useCampaignStore();

  const [analyticsReady, setAnalyticsReady] = useState(false);
  const [participationsReady, setParticipationsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchInstagramAnalytics(),
      fetchYouTubeAnalytics(),
      fetchTwitterAnalytics(),
    ]).finally(() => {
      if (!cancelled) setAnalyticsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchInstagramAnalytics, fetchYouTubeAnalytics, fetchTwitterAnalytics]);

  useEffect(() => {
    let cancelled = false;
    fetchParticipations().finally(() => {
      if (!cancelled) setParticipationsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchParticipations]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!error) return;
    Alert.alert('Error', error);
    const timer = setTimeout(() => clearError(), 5000);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  const stats = useMemo(
    () =>
      buildHomeDashboardStats({
        instagramAnalytics,
        youtubeAnalytics,
        twitterAnalytics,
        participations,
        hasLoadedParticipations: participationsReady,
        hasLoadedAnalytics: analyticsReady,
      }),
    [
      instagramAnalytics,
      youtubeAnalytics,
      twitterAnalytics,
      participations,
      participationsReady,
      analyticsReady,
    ]
  );

  const hasAnySocialConnected = isConnected || isYtConnected || isTwitterConnected;

  if (isLoading && !hasAnySocialConnected && !analyticsReady) {
    return (
      <ScrollScreen dotBackground={false} canvasColor={HOME_CANVAS} contentInsetBottom>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={appShell.cta} />
          <Text style={styles.loadingText}>Loading your overview</Text>
        </View>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen dotBackground={false} canvasColor={HOME_CANVAS} contentInsetBottom>
      <HomeReferenceHeroCard
        style={styles.section}
        ecosystemReach={stats.ecosystemReach}
        onDetailsPress={() => router.push('/influencer/my-stats')}
      />

      <HomeCampaignHealthCard
        style={styles.section}
        activeCollabs={stats.activeCollabs}
        pendingApprovals={stats.pendingApprovals}
        monthlyGoalProgress={stats.monthlyGoal.progress}
        monthlyGoalPoints={stats.monthlyGoal.points}
      />

      <HomeInvitesCard
        style={styles.section}
        unreadCount={unreadNotifications}
        onOpenInbox={() => router.push('/influencer/invites')}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  section: {
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
