import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScrollScreen, SectionHeader, PremiumCard, PrimaryButton } from '@/components/ui';
import { useSchedulerStore } from '@/store/scheduler-store';
import type { ScheduledPost } from '@/lib/scheduler-api';
import { appShell, spacing, radius } from '@/theme';
import { fonts } from '@/components/ui/typography';

const BENEFITS = [
  'Plan reels, feed posts, and stories in one place',
  'Calendar view with upcoming publish times',
];

function formatWhen(iso: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: tz || 'Asia/Kolkata',
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

function DmStatusPill({ post }: { post: ScheduledPost }) {
  if (post.dmLinkStatus === 'failed') {
    return (
      <View style={[styles.pill, styles.pillFailed]}>
        <Text style={styles.pillFailedText}>DM link failed</Text>
      </View>
    );
  }
  if (post.dmAutomationId) {
    return (
      <View style={styles.pill}>
        <Text style={styles.pillText}>Auto DM</Text>
      </View>
    );
  }
  return null;
}

function PostRow({ post }: { post: ScheduledPost }) {
  const label = post.contentType === 'reel' ? 'Reel' : post.contentType === 'story' ? 'Story' : 'Post';
  return (
    <View style={styles.postRow}>
      <View style={styles.postIcon}>
        <Ionicons
          name={post.contentType === 'reel' ? 'film-outline' : post.contentType === 'story' ? 'ellipse-outline' : 'image-outline'}
          size={18}
          color={appShell.cta}
        />
      </View>
      <View style={styles.postCopy}>
        <Text style={styles.postTitle}>{label}</Text>
        <Text style={styles.postMeta}>{formatWhen(post.scheduledAt, post.timezone)}</Text>
      </View>
    </View>
  );
}

export default function ScheduleContentScreen() {
  const router = useRouter();
  const { posts, fetchPosts, isLoading } = useSchedulerStore();

  useFocusEffect(
    useCallback(() => {
      void fetchPosts({ status: 'scheduled' });
    }, [fetchPosts])
  );

  const upcoming = posts
    .filter((p) => p.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title="Schedule Content" subtitle="Publish on your timeline" />

      <PremiumCard style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>CONTENT SCHEDULER</Text>
        <Text style={styles.heroTitle}>Upload once. Publish on time.</Text>
        <View style={styles.chipRow}>
          {['Reels', 'Posts', 'Stories'].map((chip) => (
            <View key={chip} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
            </View>
          ))}
        </View>
        {BENEFITS.map((b) => (
          <View key={b} style={styles.benefitRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={appShell.cta} />
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
        <PrimaryButton
          label="Upload your reel"
          onPress={() => router.push('/account-screens/create-scheduled-post' as never)}
        />
      </PremiumCard>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Upcoming</Text>
        <TouchableOpacity onPress={() => router.push('/account-screens/scheduled-calendar' as never)}>
          <Text style={styles.sectionLink}>Calendar</Text>
        </TouchableOpacity>
      </View>

      {isLoading && upcoming.length === 0 ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : upcoming.length === 0 ? (
        <PremiumCard>
          <Text style={styles.empty}>No scheduled content yet. Tap upload to create your first post.</Text>
        </PremiumCard>
      ) : (
        <PremiumCard style={styles.listCard}>
          {upcoming.map((p) => (
            <PostRow key={p.id} post={p} />
          ))}
        </PremiumCard>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: { gap: spacing.sm },
  heroEyebrow: { fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 1.2, color: appShell.cta },
  heroTitle: { fontFamily: fonts.bold, fontSize: 22, color: appShell.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: appShell.canvasAlt,
  },
  chipText: { fontFamily: fonts.semiBold, fontSize: 12, color: appShell.textPrimary },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  benefitText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: appShell.textMuted },
  sectionHead: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: appShell.textPrimary },
  sectionLink: { fontFamily: fonts.semiBold, fontSize: 14, color: appShell.cta },
  listCard: { gap: spacing.md },
  postRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  postIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: appShell.canvasAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCopy: { flex: 1 },
  postTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: appShell.canvasAlt,
  },
  pillText: { fontFamily: fonts.semiBold, fontSize: 10, color: appShell.cta },
  pillFailed: { backgroundColor: '#FEF3C7' },
  pillFailedText: { fontFamily: fonts.semiBold, fontSize: 10, color: '#B45309' },
  postTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: appShell.textPrimary },
  postMeta: { fontFamily: fonts.regular, fontSize: 12, color: appShell.textMuted },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: appShell.textMuted },
});
