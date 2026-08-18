import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollScreen, KollabScreenHeader } from '@/components/ui';
import { useSchedulerStore } from '@/store/scheduler-store';
import { useKollab, font, space, type as kType } from '@/theme/kollab-tokens';

export default function ScheduleContentScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const { posts, fetchPosts } = useSchedulerStore();

  useFocusEffect(
    useCallback(() => {
      void fetchPosts({ status: 'scheduled' });
    }, [fetchPosts])
  );

  const upcoming = posts
    .filter((p) => p.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 2);

  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const goCreate = () => router.push('/account-screens/create-scheduled-post' as never);

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KollabScreenHeader title="Schedule content" subtitle="Publish on your timeline" />

      <View style={styles.tileRow}>
        <Pressable
          onPress={goCreate}
          style={[styles.tile, { backgroundColor: kollab.color.chartreuse }]}
        >
          <Text style={[styles.tileTitle, { color: kollab.color.onChartreuse }]}>New post</Text>
          <Text style={[styles.tileHint, { color: kollab.color.onChartreuse }]}>
            Reels, posts, and stories
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/account-screens/scheduled-calendar' as never)}
          style={[styles.tile, { backgroundColor: kollab.color.panel }]}
        >
          <Text style={[styles.tileTitle, { color: kollab.color.chartreuse }]}>Calendar</Text>
          <Text style={[styles.tileHint, { color: kollab.color.panelInk, opacity: 0.6 }]}>
            {scheduledCount} scheduled
          </Text>
        </Pressable>
      </View>

      <View style={styles.tileRow}>
        <Pressable
          onPress={() => router.push('/account-screens/ai-caption-results' as never)}
          style={[styles.tile, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
        >
          <Text style={[styles.tileTitle, { color: kollab.color.ink }]}>AI captions</Text>
          <Text style={[styles.tileHint, { color: kollab.color.ink, opacity: 0.55 }]}>
            Pick a caption to use
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/account-screens/trending-ideas' as never)}
          style={[styles.tile, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
        >
          <Text style={[styles.tileTitle, { color: kollab.color.ink }]}>Trending</Text>
          <Text style={[styles.tileHint, { color: kollab.color.ink, opacity: 0.55 }]}>
            AI briefs for your niche
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Upload your reel</Text>
      <View style={styles.mediaRow}>
        {upcoming.map((p) => (
          <Pressable key={p.id} onPress={goCreate} style={styles.thumbWrap}>
            {p.thumbnailUrl || p.mediaUrl ? (
              <Image source={{ uri: p.thumbnailUrl || p.mediaUrl }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, { backgroundColor: kollab.color.imgBg }]} />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0)', 'rgba(11,9,6,0.6)']}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={[styles.dur, { backgroundColor: kollab.color.panel }]}>
              <Text style={[styles.durText, { color: kollab.color.panelInk }]}>
                {p.contentType === 'reel' ? 'Reel' : p.contentType === 'story' ? 'Story' : 'Post'}
              </Text>
            </View>
          </Pressable>
        ))}
        <Pressable
          onPress={goCreate}
          style={[
            styles.dashed,
            {
              backgroundColor: kollab.color.cardSoft,
              borderColor: kollab.color.outline,
            },
          ]}
        >
          <View style={[styles.plus, { backgroundColor: kollab.color.chartreuse }]}>
            <Text style={[styles.plusGlyph, { color: kollab.color.onChartreuse }]}>+</Text>
          </View>
          <Text style={[styles.dashedLabel, { color: kollab.color.ink }]}>Upload</Text>
        </Pressable>
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  tileRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  tile: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  tileTitle: {
    ...kType.rowTitle,
  },
  tileHint: {
    fontFamily: font.body,
    fontSize: 11.5,
    marginTop: 2,
    opacity: 0.65,
  },
  fieldLabel: {
    fontFamily: font.semiBold,
    fontSize: 12.5,
    opacity: 0.62,
    marginBottom: 7,
  },
  mediaRow: { flexDirection: 'row', gap: 10, marginBottom: space.md },
  thumbWrap: {
    width: 106,
    height: 146,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: { width: 106, height: 146 },
  dur: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durText: { fontFamily: font.bold, fontSize: 10.5 },
  dashed: {
    flex: 1,
    minHeight: 146,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  plus: {
    width: 30,
    height: 30,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusGlyph: { fontSize: 16, fontFamily: font.semiBold },
  dashedLabel: { fontFamily: font.semiBold, fontSize: 11, opacity: 0.65 },
});
