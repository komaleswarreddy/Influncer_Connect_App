import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  ScrollScreen,
  KollabScreenHeader,
  showKollabToast,
  showKollabConfirm,
} from '@/components/ui';
import { useSchedulerStore } from '@/store/scheduler-store';
import type { ScheduledPost } from '@/lib/scheduler-api';
import { useKollab, font, space, type as kType } from '@/theme/kollab-tokens';
import { asset } from '@/theme/kollab-tokens';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function formatWhen(iso: string, tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz || 'Asia/Kolkata',
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

export default function ScheduledCalendarScreen() {
  const kollab = useKollab();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { calendar, fetchCalendar, cancelPost, retryDmLink, isLoading } = useSchedulerStore();

  useFocusEffect(
    useCallback(() => {
      void fetchCalendar(year, month);
    }, [fetchCalendar, year, month])
  );

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const firstWeekday = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month]);

  const cells = useMemo(() => {
    const blanks = Array.from({ length: firstWeekday }, () => null as number | null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return [...blanks, ...days];
  }, [firstWeekday, daysInMonth]);

  const allPosts = useMemo(
    () =>
      Object.values(calendar)
        .flat()
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [calendar]
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const onRetryDmLink = (post: ScheduledPost) => {
    void showKollabConfirm({
      title: 'Retry DM link?',
      message: 'This will try to connect your automation to the published post again.',
      confirmLabel: 'Retry',
    }).then((ok) => {
      if (!ok) return;
      void retryDmLink(post.id)
        .then(() => {
          showKollabToast('Your automation is now active on the published post.');
          void fetchCalendar(year, month);
        })
        .catch((err) => showKollabToast(err instanceof Error ? err.message : 'Try again'));
    });
  };

  const onCancel = (post: ScheduledPost) => {
    void showKollabConfirm({
      title: 'Cancel scheduled post?',
      message: 'This will remove the post from your queue.',
      confirmLabel: 'Cancel post',
      cancelLabel: 'Keep',
      destructive: true,
    }).then((ok) => {
      if (ok) void cancelPost(post.id).then(() => void fetchCalendar(year, month));
    });
  };

  const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1)
  );

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KollabScreenHeader title="Calendar" subtitle="Scheduled content" />

      <View style={[styles.calCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
        <View style={styles.monthRow}>
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={8}>
            <Text style={[styles.monthNav, { color: kollab.color.ink }]}>‹</Text>
          </Pressable>
          <Text style={[styles.monthTitle, { color: kollab.color.ink }]}>{monthLabel}</Text>
          <Pressable onPress={() => shiftMonth(1)} hitSlop={8}>
            <Text style={[styles.monthNav, { color: kollab.color.ink }]}>›</Text>
          </Pressable>
        </View>
        <View style={styles.grid}>
          {cells.map((day, idx) => {
            if (!day) return <View key={`blank-${idx}`} style={styles.cell} />;
            const key = dateKey(year, month, day);
            const count = calendar[key]?.length ?? 0;
            const has = count > 0;
            return (
              <View
                key={key}
                style={[
                  styles.cell,
                  {
                    backgroundColor: has ? kollab.color.chartreuse : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cellDay,
                    {
                      color: has ? kollab.color.onChartreuse : kollab.color.ink,
                      fontFamily: has ? font.bold : font.body,
                    },
                  ]}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
        {isLoading ? <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 8 }} /> : null}
      </View>

      {allPosts.length === 0 && !isLoading ? (
        <Text style={[styles.empty, { color: kollab.color.ink }]}>
          No scheduled posts this month.
        </Text>
      ) : (
        <View style={styles.list}>
          {allPosts.map((post) => (
            <View
              key={post.id}
              style={[styles.postRow, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
            >
              <View style={[styles.postThumb, { backgroundColor: kollab.color.imgBg }]}>
                <Image
                  source={
                    post.thumbnailUrl || post.mediaUrl
                      ? { uri: post.thumbnailUrl || post.mediaUrl }
                      : asset.contentThumbA
                  }
                  style={styles.postThumbImg}
                />
              </View>
              <View style={styles.postCopy}>
                <Text style={[styles.postWhen, { color: kollab.color.ink }]}>
                  {formatWhen(post.scheduledAt, post.timezone)}
                </Text>
                <Text style={[styles.postCaption, { color: kollab.color.ink }]} numberOfLines={1}>
                  {post.caption || post.contentType}
                </Text>
                {post.dmAutomationId ? (
                  <View style={[styles.autoDm, { backgroundColor: kollab.color.tint }]}>
                    <Text style={[styles.autoDmText, { color: kollab.color.violetDeep }]}>
                      Auto DM
                    </Text>
                  </View>
                ) : null}
                {post.dmLinkStatus === 'failed' ? (
                  <Pressable onPress={() => onRetryDmLink(post)}>
                    <Text style={[styles.failed, { color: kollab.color.heat }]}>
                      DM link failed · Retry
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              {post.status === 'scheduled' ? (
                <Pressable
                  onPress={() => onCancel(post)}
                  style={[styles.cancelBtn, { borderColor: kollab.color.outline }]}
                >
                  <Text style={[styles.cancelText, { color: kollab.color.ink }]}>Cancel</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  calCard: { borderRadius: 24, padding: 18, marginBottom: 16 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthTitle: { ...kType.sectionTitle },
  monthNav: { fontSize: 22, paddingHorizontal: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: {
    width: `${(100 - 6 * 6) / 7}%` as unknown as number,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    flexBasis: '12%',
    maxWidth: '14%',
  },
  cellDay: { fontSize: 12 },
  empty: { fontFamily: font.body, fontSize: 13, opacity: 0.55, textAlign: 'center' },
  list: { gap: 9 },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 17,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  postThumb: { width: 44, height: 56, borderRadius: 12, overflow: 'hidden' },
  postThumbImg: { width: 44, height: 56 },
  postCopy: { flex: 1, minWidth: 0 },
  postWhen: { fontFamily: font.semiBold, fontSize: 13.5 },
  postCaption: { fontFamily: font.body, fontSize: 11.5, opacity: 0.55, marginTop: 2 },
  autoDm: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 5,
  },
  autoDmText: { fontFamily: font.bold, fontSize: 10.5 },
  failed: { fontFamily: font.semiBold, fontSize: 11, marginTop: 4 },
  cancelBtn: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 13,
    flexShrink: 0,
  },
  cancelText: { fontFamily: font.semiBold, fontSize: 11.5 },
});
