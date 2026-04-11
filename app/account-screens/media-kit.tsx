import React, { useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useInfluencerStore } from '../../store/influencer-store';
import { ScrollScreen, SectionHeader, PremiumCard } from '@/components/ui';
import { appShell, palette, premiumNavy, radius, shadow, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';

const PLATFORM_META: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; accent: string; label: string }
> = {
  Instagram: { icon: 'logo-instagram', accent: '#E4405F', label: 'Instagram' },
  YouTube: { icon: 'logo-youtube', accent: '#FF0000', label: 'YouTube' },
  Twitter: { icon: 'logo-twitter', accent: '#1D9BF0', label: 'Twitter / X' },
};

export default function MediaKitScreen() {
  const {
    instagramAnalytics: insta,
    youtubeAnalytics: yt,
    twitterAnalytics: tw,
    isLoading,
    error,
    fetchInstagramAnalytics,
    fetchYouTubeAnalytics,
    fetchTwitterAnalytics,
  } = useInfluencerStore();

  useEffect(() => {
    fetchInstagramAnalytics();
    fetchYouTubeAnalytics();
    fetchTwitterAnalytics();
  }, [fetchInstagramAnalytics, fetchYouTubeAnalytics, fetchTwitterAnalytics]);

  const userName =
    insta?.username || yt?.username || tw?.username || 'Influencer';
  const profilePic =
    insta?.profilePictureUrl ||
    yt?.profilePictureUrl ||
    tw?.profilePictureUrl ||
    'https://unavatar.io/github/octocat';

  const connected = insta || yt || tw;

  const avgEngagement = () => {
    const list = [insta, yt, tw].filter(Boolean);
    if (!list.length) return '0.00';
    const sum = list.reduce(
      (s, a) => s + parseFloat(String(a?.averageEngagementRate || '0')),
      0
    );
    return (sum / list.length).toFixed(2);
  };

  const renderAnalyticsCard = (analytics: any, platform: keyof typeof PLATFORM_META) => {
    if (!analytics) return null;
    const meta = PLATFORM_META[platform];
    const followerCount =
      platform === 'YouTube' ? analytics.subscriberCount : analytics.followerCount;
    const followerLabel = platform === 'YouTube' ? 'Subscribers' : 'Followers';

    return (
      <PremiumCard
        key={platform}
        compact
        style={styles.platformCard}
        title={meta.label}
        headerRight={
          <View style={[styles.platformIconWrap, { borderColor: meta.accent + '55' }]}>
            <Ionicons name={meta.icon} size={22} color={meta.accent} />
          </View>
        }
      >
        <Text style={styles.handle}>@{analytics.username}</Text>
        <View style={styles.statRow}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>{followerLabel}</Text>
            <Text style={styles.statValue}>{followerCount?.toLocaleString() ?? '—'}</Text>
          </View>
          <View style={[styles.statCell, styles.statCellAlt]}>
            <Text style={styles.statLabel}>Engagement</Text>
            <Text style={[styles.statValue, styles.statValueAccent]}>
              {parseFloat(String(analytics.averageEngagementRate || '0')).toFixed(2)}%
            </Text>
          </View>
        </View>
        <View style={styles.metaGrid}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Top location</Text>
            <Text style={styles.metaValue} numberOfLines={2}>
              {analytics.topAudienceLocation || '—'}
            </Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Age range</Text>
            <Text style={styles.metaValue}>{analytics.audienceDemographicsAgeRange || '—'}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Male</Text>
            <Text style={styles.metaValue}>{analytics.malePercentage ?? '—'}%</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Female</Text>
            <Text style={styles.metaValue}>{analytics.femalePercentage ?? '—'}%</Text>
          </View>
        </View>
      </PremiumCard>
    );
  };

  if (isLoading && !connected) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={appShell.cta} />
        <Text style={styles.hint}>Loading your media kit…</Text>
      </View>
    );
  }

  if (error && !connected) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={40} color={appShell.textMuted} />
        <Text style={styles.errorText}>
          Could not load your media kit. Connect your accounts from the dashboard and try again.
        </Text>
      </View>
    );
  }

  if (!connected) {
    return (
      <View style={styles.centered}>
        <Ionicons name="images-outline" size={40} color={appShell.textMuted} />
        <Text style={styles.emptyTitle}>No connected platforms</Text>
        <Text style={styles.emptyBody}>
          Connect at least one social account on your dashboard to see analytics here.
        </Text>
      </View>
    );
  }

  const primaryHub =
    insta?.topAudienceLocation || yt?.topAudienceLocation || tw?.topAudienceLocation || 'N/A';

  return (
    <ScrollScreen
      safeAreaEdges={['left', 'right', 'bottom']}
      padH={spacing.md}
      scrollProps={{ showsVerticalScrollIndicator: false }}
    >
      <SectionHeader
        overline="Creator"
        title="Media kit"
        subtitle="Share-ready snapshot of your reach and audience."
        comfortable
      />

      <View style={styles.printBlock}>
        <LinearGradient
          {...premiumNavy.base}
          style={styles.hero}
        >
          <View style={styles.heroSheen}>
            <LinearGradient {...premiumNavy.sheen} style={StyleSheet.absoluteFill} />
          </View>
          <Image source={{ uri: profilePic }} style={styles.avatar} />
          <Text style={styles.heroName}>{userName}</Text>
          <Text style={styles.heroSubtitle}>Influencer media kit</Text>
          <View style={styles.heroPills}>
            <View style={styles.pill}>
              <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={styles.pillText}>Avg. engagement {avgEngagement()}%</Text>
            </View>
          </View>
        </LinearGradient>

        <PremiumCard comfortable title="Audience overview" style={styles.overviewCard}>
          <Text style={styles.overviewBody}>
            Combined view across your connected platforms. Primary audience hubs:{' '}
            <Text style={styles.overviewEm}>{primaryHub}</Text>. Average engagement across platforms:{' '}
            <Text style={styles.overviewEm}>{avgEngagement()}%</Text>.
          </Text>
        </PremiumCard>

        {renderAnalyticsCard(insta, 'Instagram')}
        {renderAnalyticsCard(yt, 'YouTube')}
        {renderAnalyticsCard(tw, 'Twitter')}
      </View>

    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: appShell.canvas,
  },
  hint: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: appShell.textSecondary,
  },
  errorText: {
    marginTop: spacing.md,
    color: palette.error,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: fonts.regular,
    lineHeight: 21,
  },
  emptyTitle: {
    marginTop: spacing.md,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: appShell.textPrimary,
  },
  emptyBody: {
    marginTop: spacing.xs,
    fontSize: 14,
    color: appShell.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    fontFamily: fonts.regular,
  },
  printBlock: {
    marginBottom: spacing.md,
  },
  hero: {
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  heroSheen: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: spacing.sm,
  },
  heroName: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: '#F8FAFC',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: 'rgba(226,232,240,0.85)',
  },
  heroPills: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pillText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: 'rgba(248,250,252,0.95)',
  },
  overviewCard: {
    marginBottom: spacing.md,
  },
  overviewBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: appShell.textPrimary,
  },
  overviewEm: {
    fontFamily: fonts.semiBold,
    color: appShell.cta,
  },
  platformCard: {
    marginBottom: spacing.md,
  },
  platformIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appShell.canvasAlt,
  },
  handle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: appShell.textSecondary,
    marginBottom: spacing.sm,
    marginTop: -4,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCell: {
    flex: 1,
    backgroundColor: appShell.iceBlueStrong,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  statCellAlt: {
    backgroundColor: appShell.canvasAlt,
  },
  statLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: appShell.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: appShell.textPrimary,
  },
  statValueAccent: {
    color: appShell.cta,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaCell: {
    width: '47%',
    backgroundColor: appShell.canvasAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
  },
  metaLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: appShell.textMuted,
    marginBottom: 4,
  },
  metaValue: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: appShell.textPrimary,
  },
});
