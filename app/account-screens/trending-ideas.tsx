import React, { useCallback } from 'react';
import { View, Text, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScrollScreen, KollabScreenHeader, KollabTextField, KollabButton } from '@/components/ui';
import { useContentIdeasStore } from '@/store/content-ideas-store';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';

export default function TrendingIdeasScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const { ideas, keyword, isLoading, error, cached, setKeyword, fetchTrending } =
    useContentIdeasStore();

  useFocusEffect(
    useCallback(() => {
      void fetchTrending();
    }, [fetchTrending])
  );

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={isLoading && ideas.length > 0}
            onRefresh={() => void fetchTrending({ refresh: true })}
            tintColor={kollab.color.ink}
          />
        ),
      }}
    >
      <KollabScreenHeader title="Trending ideas" subtitle="AI briefs for your niche" />

      <View style={styles.searchRow}>
        <KollabTextField
          placeholder="Optional keyword or topic"
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={() => void fetchTrending()}
          style={styles.search}
        />
        <KollabButton
          label={isLoading ? 'Refreshing…' : 'Refresh'}
          variant="ink"
          compact
          disabled={isLoading}
          onPress={() => void fetchTrending({ refresh: true })}
          style={styles.refresh}
        />
      </View>

      {cached ? (
        <Text style={[styles.cached, { color: kollab.color.ink }]}>
          Cached brief (refreshes every few hours)
        </Text>
      ) : ideas.length > 0 ? (
        <Text style={[styles.cached, { color: kollab.color.ink }]}>
          Fresh brief from your profile
        </Text>
      ) : null}
      {error ? <Text style={[styles.error, { color: kollab.color.heat }]}>{error}</Text> : null}
      {isLoading && ideas.length === 0 ? (
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 20 }} />
      ) : null}

      <View style={styles.list}>
        {ideas.map((idea, i) => (
          <View
            key={`${idea.title}-${i}`}
            style={[styles.ideaCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
          >
            <Text style={[styles.ideaTitle, { color: kollab.color.ink }]}>{idea.title}</Text>
            <Text style={[styles.hook, { color: kollab.color.ink }]}>{idea.hook}</Text>
            <View style={[styles.metaRow, { borderTopColor: kollab.color.hairline }]}>
              <Text style={[styles.metaLabel, { color: kollab.color.ink }]}>best time</Text>
              <View style={[styles.timeChip, { backgroundColor: kollab.color.tint }]}>
                <Text style={[styles.timeText, { color: kollab.color.violetDeep }]}>
                  {idea.bestTime}
                </Text>
              </View>
              <KollabButton
                label="Use for schedule"
                compact
                onPress={() =>
                  router.push({
                    pathname: '/account-screens/create-scheduled-post',
                    params: { appliedCaption: idea.hook, appliedHashtags: idea.hashtags },
                  } as never)
                }
                style={styles.useBtn}
              />
            </View>
          </View>
        ))}
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 9, marginBottom: 18, alignItems: 'center' },
  search: { flex: 1, minWidth: 0 },
  refresh: { paddingHorizontal: 18 },
  cached: { fontFamily: font.body, fontSize: 12, opacity: 0.5, marginBottom: 10 },
  error: { fontFamily: font.medium, fontSize: 13, marginBottom: 10 },
  list: { gap: 10 },
  ideaCard: { borderRadius: 22, paddingVertical: 16, paddingHorizontal: 18 },
  ideaTitle: { ...kType.sectionTitle },
  hook: { fontFamily: font.body, fontSize: 13, lineHeight: 20, opacity: 0.6, marginTop: 6 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    flexWrap: 'wrap',
  },
  metaLabel: {
    fontFamily: font.bold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  timeChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  timeText: { fontFamily: font.bold, fontSize: 11 },
  useBtn: { marginLeft: 'auto', paddingHorizontal: 14, paddingVertical: 8 },
});
