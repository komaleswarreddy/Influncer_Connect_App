import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { useInfluencerStore } from '@/store/influencer-store';
import {
  ScrollScreen,
  PremiumCard,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
  StrategicOverviewHeroCard,
  ListRow,
  GlassSocialIcon,
} from '@/components/ui';
import { appShell, palette, spacing, radius } from '@/theme';
import { fonts } from '@/components/ui/typography';

type PlatformKey = 'instagram' | 'youtube' | 'twitter';

export default function InfluencerDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const {
    isLoading,
    error,
    isConnected,
    isYtConnected,
    isTwitterConnected,
    connectInstagram,
    fetchInstagramAnalytics,
    connectYouTube,
    fetchYouTubeAnalytics,
    connectTwitter,
    fetchTwitterAnalytics,
    clearError,
  } = useInfluencerStore();

  const [instagramUsername, setInstagramUsername] = useState('');
  const [youtubeUsername, setYoutubeUsername] = useState('');
  const [twitterUsername, setTwitterUsername] = useState('');
  const [editingPlatform, setEditingPlatform] = useState<PlatformKey | null>(null);

  const stats = {
    monthlyGoal: { progress: 53, points: 350 },
    ecosystemReach: '12.4M',
    activeCollabs: 12,
    pendingApprovals: 8,
  };

  useEffect(() => {
    fetchInstagramAnalytics();
    fetchYouTubeAnalytics();
    fetchTwitterAnalytics();
  }, [fetchInstagramAnalytics, fetchYouTubeAnalytics, fetchTwitterAnalytics]);

  useEffect(() => {
    if (!error) return;
    Alert.alert('Error', error);
    const timer = setTimeout(() => clearError(), 5000);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  const isMediaKitReady = isConnected || isYtConnected || isTwitterConnected;

  const platformMeta = [
    {
      key: 'instagram' as const,
      title: 'Instagram',
      icon: 'logo-instagram' as React.ComponentProps<typeof Ionicons>['name'],
      connected: isConnected,
      placeholder: 'instagram username',
      value: instagramUsername,
      setValue: setInstagramUsername,
      connect: async () => connectInstagram(instagramUsername.trim()),
    },
    {
      key: 'youtube' as const,
      title: 'YouTube',
      icon: 'logo-youtube' as React.ComponentProps<typeof Ionicons>['name'],
      connected: isYtConnected,
      placeholder: 'youtube username',
      value: youtubeUsername,
      setValue: setYoutubeUsername,
      connect: async () => connectYouTube(youtubeUsername.trim()),
    },
    {
      key: 'twitter' as const,
      title: 'Twitter',
      icon: 'logo-twitter' as React.ComponentProps<typeof Ionicons>['name'],
      connected: isTwitterConnected,
      placeholder: '@username',
      value: twitterUsername,
      setValue: setTwitterUsername,
      connect: async () => connectTwitter(twitterUsername.trim()),
    },
  ];

  const handleConnect = async (key: PlatformKey) => {
    const meta = platformMeta.find((item) => item.key === key);
    if (!meta) return;
    if (!meta.value.trim()) {
      Alert.alert('Error', `Please enter your ${meta.title} username`);
      return;
    }
    try {
      await meta.connect();
      Alert.alert('Success', `${meta.title} connected successfully`);
      meta.setValue('');
      setEditingPlatform(null);
    } catch {
      Alert.alert('Error', `Failed to connect ${meta.title}`);
    }
  };

  if (isLoading && !isMediaKitReady) {
    return (
      <ScrollScreen>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={appShell.cta} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <StrategicOverviewHeroCard
        style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}
        overline="Strategic overview"
        title="Your Stats"
        subtitle={`Welcome back${user?.firstName ? `, ${user.firstName}` : ''}.`}
        metricValue={stats.ecosystemReach}
        metricLabel="Ecosystem Reach"
        onDetailsPress={() => router.push('/account-screens/media-kit')}
      />

      <PremiumCard style={{ marginBottom: spacing.sm }}>
        <SectionHeader title="Campaign Health" subtitle="Performance snapshot" />
        <View style={styles.kpiGrid}>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiValue}>{stats.activeCollabs}</Text>
            <Text style={styles.kpiLabel}>Active Collabs</Text>
            <View style={styles.kpiBarTrack}>
              <View style={[styles.kpiBarFill, styles.kpiBarFillPrimary, { width: '72%' }]} />
            </View>
          </View>
          <View style={styles.kpiTile}>
            <Text style={styles.kpiValue}>{stats.pendingApprovals}</Text>
            <Text style={styles.kpiLabel}>Pending Approvals</Text>
            <View style={styles.kpiBarTrack}>
              <View style={[styles.kpiBarFill, styles.kpiBarFillMuted, { width: '48%' }]} />
            </View>
          </View>
        </View>
        <View style={styles.goalWrap}>
          <Text style={styles.goalTitle}>Monthly Goal</Text>
          <Text style={styles.goalCaption}>
            {stats.monthlyGoal.points} points at {stats.monthlyGoal.progress}% completion
          </Text>
          <View style={styles.goalTrack}>
            <View style={[styles.goalFill, { width: `${stats.monthlyGoal.progress}%` }]} />
          </View>
        </View>
      </PremiumCard>

      {isMediaKitReady ? (
        <PremiumCard style={{ marginBottom: spacing.sm }}>
          <SectionHeader
            title="Your Media Kit Is Ready"
            subtitle="View combined analytics in one premium report."
          />
          <PrimaryButton
            label="View Media Kit"
            compact
            pill
            onPress={() => router.push('/account-screens/media-kit')}
          />
        </PremiumCard>
      ) : null}

      <PremiumCard>
        <SectionHeader
          title="Connected Pools"
          subtitle="Connect your channels to unlock richer insights."
        />
        {platformMeta.map((item, index) => (
          <View key={item.key} style={index > 0 ? styles.rowBorder : undefined}>
            <ListRow
              compact
              title={item.title}
              subtitle={item.connected ? 'Connected' : 'Not connected'}
              leftSlot={<GlassSocialIcon platform={item.key} size={40} />}
              status={item.connected ? 'success' : 'warning'}
              showChevron={false}
            />
            {!item.connected ? (
              <View style={styles.connectRow}>
                {editingPlatform === item.key ? (
                  <View style={styles.inlineEditor}>
                    <TextInput
                      value={item.value}
                      onChangeText={item.setValue}
                      placeholder={item.placeholder}
                      placeholderTextColor={appShell.textMuted}
                      style={styles.input}
                      autoCapitalize="none"
                    />
                    <View style={styles.editorActions}>
                      <SecondaryButton
                        label="Cancel"
                        onPress={() => setEditingPlatform(null)}
                        style={{ flex: 1 }}
                      />
                      <PrimaryButton
                        label="Connect"
                        onPress={() => handleConnect(item.key)}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                ) : (
                  <SecondaryButton
                    label={`Connect ${item.title}`}
                    onPress={() => setEditingPlatform(item.key)}
                  />
                )}
              </View>
            ) : null}
          </View>
        ))}
      </PremiumCard>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 52,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: appShell.textSecondary,
    fontFamily: fonts.regular,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kpiTile: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: appShell.canvasAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.borderSubtle,
  },
  kpiBarTrack: {
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(10, 17, 40, 0.08)',
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  kpiBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  kpiBarFillPrimary: {
    backgroundColor: palette.primary,
  },
  kpiBarFillMuted: {
    backgroundColor: appShell.textMuted,
  },
  kpiValue: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: appShell.textPrimary,
    letterSpacing: -0.5,
  },
  kpiLabel: {
    marginTop: 2,
    color: appShell.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  goalWrap: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: appShell.canvasAlt,
    padding: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.borderSubtle,
  },
  goalTitle: {
    color: appShell.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  goalCaption: {
    marginTop: 2,
    color: appShell.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  goalTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: appShell.iceBlueStrong,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: appShell.cta,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appShell.borderSubtle,
  },
  connectRow: {
    paddingBottom: spacing.xs,
  },
  inlineEditor: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  input: {
    backgroundColor: appShell.canvasAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: appShell.textPrimary,
    fontFamily: fonts.regular,
  },
  editorActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
