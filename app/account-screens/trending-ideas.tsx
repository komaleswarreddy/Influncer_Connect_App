import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  RefreshControl,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScrollScreen } from '@/components/ui';
import { useContentIdeasStore } from '@/store/content-ideas-store';
import type { TrendingPlatform } from '@/lib/content-ideas-api';
import { useHomeDesign, homeFonts } from '@/theme/homeDesign';

const PLATFORMS: { key: TrendingPlatform; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
];

export default function TrendingIdeasScreen() {
  const router = useRouter();
  const d = useHomeDesign();
  const {
    ideas,
    platform,
    keyword,
    isLoading,
    error,
    cached,
    setPlatform,
    setKeyword,
    fetchTrending,
  } = useContentIdeasStore();

  useFocusEffect(
    useCallback(() => {
      void fetchTrending();
    }, [fetchTrending])
  );

  return (
    <ScrollScreen safeAreaEdges={['bottom']} dotBackground={false} canvasColor={d.bg}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: d.ink }]}>Trending ideas</Text>
        <Text style={[styles.subtitle, { color: d.mut }]}>AI briefs for your niche</Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: d.surf,
            borderColor: d.line,
            shadowColor: d.shadowColor,
            shadowOpacity: d.shadowOpacity,
          },
        ]}
      >
        <View style={[styles.tabBar, { backgroundColor: d.tint }]}>
          {PLATFORMS.map((p) => {
            const active = p.key === platform;
            return (
              <Pressable
                key={p.key}
                onPress={() => {
                  setPlatform(p.key);
                  void fetchTrending({ platform: p.key });
                }}
                style={({ pressed }) => [
                  styles.tab,
                  active && { backgroundColor: d.ink },
                  pressed && styles.pressed95,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tabText, { color: active ? d.onInk : d.mut }]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          style={[styles.input, { borderColor: d.line, backgroundColor: d.tintSoft, color: d.ink }]}
          placeholder="Optional keyword or topic"
          placeholderTextColor={d.mut}
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={() => void fetchTrending()}
        />

        <Pressable
          onPress={() => void fetchTrending()}
          style={({ pressed }) => [
            styles.refreshButton,
            { backgroundColor: d.ink, shadowColor: d.shadowColor },
            pressed && styles.pressed975,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Refresh ideas"
        >
          <Text style={[styles.refreshText, { color: d.onInk }]}>Refresh ideas</Text>
        </Pressable>

        {cached ? (
          <Text style={[styles.cached, { color: d.mut }]}>
            Cached brief (refreshes every few hours)
          </Text>
        ) : null}
        {error ? <Text style={[styles.error, { color: d.warn }]}>{error}</Text> : null}
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => void fetchTrending()}
            tintColor={d.ink}
          />
        }
      >
        {ideas.map((idea, i) => (
          <View
            key={`${idea.title}-${i}`}
            style={[
              styles.ideaCard,
              {
                backgroundColor: d.surf,
                borderColor: d.line,
                shadowColor: d.shadowColor,
                shadowOpacity: d.shadowOpacity,
              },
            ]}
          >
            <Text style={[styles.ideaTitle, { color: d.ink }]}>{idea.title}</Text>
            <Text style={[styles.hook, { color: d.ink }]}>{idea.hook}</Text>
            {idea.hashtags ? (
              <Text style={[styles.tags, { color: d.mut }]}>{idea.hashtags}</Text>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: d.mut }]}>Best time</Text>
              <Text style={[styles.metaValue, { color: d.ink }]}>{idea.bestTime}</Text>
            </View>
            <Text style={[styles.rationale, { color: d.mut }]}>{idea.rationale}</Text>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/account-screens/create-scheduled-post',
                  params: { appliedCaption: idea.hook, appliedHashtags: idea.hashtags },
                } as never)
              }
              style={({ pressed }) => [
                styles.useButton,
                { borderColor: d.line, backgroundColor: d.tintSoft },
                pressed && styles.pressed985,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Use for schedule"
            >
              <Text style={[styles.useButtonText, { color: d.ink }]}>Use for schedule</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 14,
  },
  title: {
    fontFamily: homeFonts.displayBold,
    fontSize: 22,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: homeFonts.medium,
    fontSize: 13,
    marginTop: 3,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 14,
    gap: 12,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowRadius: 10 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  tabBar: {
    flexDirection: 'row',
    gap: 4,
    borderRadius: 999,
    padding: 4,
  },
  tab: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: homeFonts.bold,
    fontSize: 12.5,
    letterSpacing: -0.1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: homeFonts.regular,
    fontSize: 14,
  },
  refreshButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.24, shadowRadius: 20 },
      android: { elevation: 6 },
      default: {},
    }),
  },
  refreshText: {
    fontFamily: homeFonts.bold,
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  cached: {
    fontFamily: homeFonts.regular,
    fontSize: 12,
  },
  error: {
    fontFamily: homeFonts.medium,
    fontSize: 13,
  },
  list: {
    flex: 1,
  },
  ideaCard: {
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowRadius: 10 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  ideaTitle: {
    fontFamily: homeFonts.displaySemiBold,
    fontSize: 17,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  hook: {
    fontFamily: homeFonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  tags: {
    fontFamily: homeFonts.medium,
    fontSize: 13,
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 12,
  },
  metaLabel: {
    fontFamily: homeFonts.bold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontFamily: homeFonts.medium,
    fontSize: 12.5,
  },
  rationale: {
    fontFamily: homeFonts.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 14,
  },
  useButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
  },
  useButtonText: {
    fontFamily: homeFonts.bold,
    fontSize: 13.5,
    letterSpacing: -0.2,
  },
  pressed95: {
    transform: [{ scale: 0.95 }],
  },
  pressed975: {
    transform: [{ scale: 0.975 }],
  },
  pressed985: {
    transform: [{ scale: 0.985 }],
  },
});
