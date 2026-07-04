import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, RefreshControl, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ScrollScreen,
  SectionHeader,
  PremiumCard,
  PrimaryButton,
  PremiumSegmentedControl,
  SecondaryButton,
} from '@/components/ui';
import { useContentIdeasStore } from '@/store/content-ideas-store';
import type { TrendingPlatform } from '@/lib/content-ideas-api';
import { appShell, spacing, radius } from '@/theme';
import { fonts } from '@/components/ui/typography';

const PLATFORMS: { key: TrendingPlatform; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
];

export default function TrendingIdeasScreen() {
  const router = useRouter();
  const { ideas, platform, keyword, isLoading, error, cached, setPlatform, setKeyword, fetchTrending } =
    useContentIdeasStore();

  useFocusEffect(
    useCallback(() => {
      void fetchTrending();
    }, [fetchTrending])
  );

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title="Trending ideas" subtitle="AI briefs for your niche" />
      <PremiumCard style={{ marginBottom: spacing.sm }}>
        <PremiumSegmentedControl
          segments={PLATFORMS.map((p) => ({ key: p.key, label: p.label }))}
          value={platform}
          onChange={(k) => {
            setPlatform(k as TrendingPlatform);
            void fetchTrending({ platform: k as TrendingPlatform });
          }}
        />
        <TextInput
          style={styles.input}
          placeholder="Optional keyword or topic"
          placeholderTextColor={appShell.textMuted}
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={() => void fetchTrending()}
        />
        <PrimaryButton label="Refresh ideas" onPress={() => void fetchTrending()} />
        {cached ? <Text style={styles.cached}>Cached brief (refreshes every few hours)</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </PremiumCard>

      <ScrollView refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void fetchTrending()} />}>
        {ideas.map((idea, i) => (
          <PremiumCard key={`${idea.title}-${i}`} style={{ marginBottom: spacing.sm }}>
            <Text style={styles.ideaTitle}>{idea.title}</Text>
            <Text style={styles.hook}>{idea.hook}</Text>
            {idea.hashtags ? <Text style={styles.tags}>{idea.hashtags}</Text> : null}
            <Text style={styles.meta}>Best time: {idea.bestTime}</Text>
            <Text style={styles.rationale}>{idea.rationale}</Text>
            <SecondaryButton
              label="Use for schedule"
              onPress={() =>
                router.push({
                  pathname: '/account-screens/create-scheduled-post',
                  params: { appliedCaption: idea.hook, appliedHashtags: idea.hashtags },
                } as never)
              }
            />
          </PremiumCard>
        ))}
      </ScrollView>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: appShell.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginVertical: spacing.sm,
    fontFamily: fonts.regular,
    color: appShell.textPrimary,
  },
  cached: { fontFamily: fonts.regular, fontSize: 12, color: appShell.textMuted, marginTop: spacing.xs },
  error: { fontFamily: fonts.regular, fontSize: 13, color: appShell.error, marginTop: spacing.xs },
  ideaTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: appShell.textPrimary, marginBottom: spacing.xs },
  hook: { fontFamily: fonts.regular, fontSize: 14, color: appShell.textPrimary, lineHeight: 20 },
  tags: { fontFamily: fonts.regular, fontSize: 13, color: appShell.cta, marginTop: spacing.xs },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: appShell.textSecondary, marginTop: spacing.xs },
  rationale: { fontFamily: fonts.regular, fontSize: 12, color: appShell.textMuted, marginTop: spacing.xs, marginBottom: spacing.sm },
});
