import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScrollScreen, SectionHeader, PremiumCard, SecondaryButton } from '@/components/ui';
import { useSchedulerStore } from '@/store/scheduler-store';
import type { ScheduledPost } from '@/lib/scheduler-api';
import { appShell, spacing, radius, palette } from '@/theme';
import { fonts } from '@/components/ui/typography';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

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

export default function ScheduledCalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [listMode, setListMode] = useState(false);

  const { calendar, fetchCalendar, cancelPost, retryDmLink, isLoading, isSaving } = useSchedulerStore();

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

  const postsForSelected = useMemo(() => {
    if (!selectedDay) return [] as ScheduledPost[];
    return calendar[dateKey(year, month, selectedDay)] ?? [];
  }, [calendar, selectedDay, year, month]);

  const allPosts = useMemo(
    () =>
      Object.entries(calendar)
        .flatMap(([, posts]) => posts)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [calendar]
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSelectedDay(null);
  };

  const openDay = (day: number) => {
    setSelectedDay(day);
    setSheetOpen(true);
  };

  const onRetryDmLink = (post: ScheduledPost) => {
    Alert.alert('Retry DM link?', 'This will try to connect your automation to the published post again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Retry',
        onPress: () =>
          void retryDmLink(post.id)
            .then(() => {
              Alert.alert('DM linked', 'Your automation is now active on the published post.');
              void fetchCalendar(year, month);
            })
            .catch((err) =>
              Alert.alert('Retry failed', err instanceof Error ? err.message : 'Try again')
            ),
      },
    ]);
  };

  const renderDmBadges = (post: ScheduledPost) => (
    <View style={styles.badgeRow}>
      {post.dmAutomationId ? (
        <View style={styles.autoDmPill}>
          <Text style={styles.autoDmText}>Auto DM</Text>
        </View>
      ) : null}
      {post.dmLinkStatus === 'failed' ? (
        <TouchableOpacity style={styles.failedPill} onPress={() => onRetryDmLink(post)}>
          <Text style={styles.failedPillText}>DM link failed · Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const onCancel = (post: ScheduledPost) => {
    Alert.alert('Cancel scheduled post?', 'This will remove the post from your queue.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel post',
        style: 'destructive',
        onPress: () => void cancelPost(post.id).then(() => void fetchCalendar(year, month)),
      },
    ]);
  };

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title="Calendar" subtitle="Scheduled content" />

      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => shiftMonth(-1)}>
          <Ionicons name="chevron-back-outline" size={22} color={appShell.cta} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))}
        </Text>
        <TouchableOpacity onPress={() => shiftMonth(1)}>
          <Ionicons name="chevron-forward-outline" size={22} color={appShell.cta} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.listToggle} onPress={() => setListMode((v) => !v)}>
          <Text style={styles.listToggleText}>{listMode ? 'Grid' : 'List'}</Text>
        </TouchableOpacity>
      </View>

      {listMode ? (
        allPosts.length === 0 ? (
          <PremiumCard>
            <Text style={styles.empty}>No scheduled posts this month.</Text>
          </PremiumCard>
        ) : (
          allPosts.map((post) => (
            <PremiumCard key={post.id} style={styles.listCard}>
              <Text style={styles.listTitle}>{post.contentType.toUpperCase()}</Text>
              <Text style={styles.listMeta}>{formatWhen(post.scheduledAt, post.timezone)}</Text>
              {post.status === 'scheduled' ? (
                <SecondaryButton label="Cancel" onPress={() => onCancel(post)} />
              ) : null}
            </PremiumCard>
          ))
        )
      ) : (
        <PremiumCard style={styles.gridCard}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekLabel}>
                {w}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`blank-${idx}`} style={styles.cell} />;
              const key = dateKey(year, month, day);
              const count = calendar[key]?.length ?? 0;
              const selected = selectedDay === day;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.cell, selected && styles.cellSelected]}
                  onPress={() => openDay(day)}
                >
                  <Text style={[styles.cellDay, selected && styles.cellDaySelected]}>{day}</Text>
                  {count > 0 ? <View style={styles.dot} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
          {isLoading ? <Text style={styles.empty}>Loading calendar…</Text> : null}
        </PremiumCard>
      )}

      <Modal visible={sheetOpen} transparent animationType="slide">
        <View style={styles.sheetBackdrop}>
          <PremiumCard style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>
              {selectedDay
                ? new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(
                    new Date(year, month - 1, selectedDay)
                  )
                : 'Posts'}
            </Text>
            {postsForSelected.length === 0 ? (
              <Text style={styles.empty}>No posts on this date.</Text>
            ) : (
              postsForSelected.map((post) => (
                <View key={post.id} style={styles.sheetRow}>
                  <View style={styles.sheetCopy}>
                    <Text style={styles.listTitle}>{post.contentType}</Text>
                    <Text style={styles.listMeta}>{formatWhen(post.scheduledAt, post.timezone)}</Text>
                  </View>
                  {post.status === 'scheduled' ? (
                    <TouchableOpacity onPress={() => onCancel(post)}>
                      <Ionicons name="trash-outline" size={18} color={appShell.cta} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))
            )}
            <SecondaryButton label="Close" onPress={() => setSheetOpen(false)} />
          </PremiumCard>
        </View>
      </Modal>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  monthLabel: { flex: 1, textAlign: 'center', fontFamily: fonts.semiBold, fontSize: 16, color: appShell.textPrimary },
  listToggle: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: appShell.canvasAlt,
  },
  listToggleText: { fontFamily: fonts.semiBold, fontSize: 12, color: appShell.cta },
  gridCard: { gap: spacing.sm },
  weekRow: { flexDirection: 'row' },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: appShell.textMuted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  cellSelected: { backgroundColor: appShell.canvasAlt },
  cellDay: { fontFamily: fonts.semiBold, fontSize: 14, color: appShell.textPrimary },
  cellDaySelected: { fontFamily: fonts.bold, color: appShell.cta },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: appShell.cta,
    marginTop: 2,
  },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: appShell.textMuted, textAlign: 'center' },
  listCard: { marginBottom: spacing.sm, gap: spacing.xs },
  listTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: appShell.textPrimary },
  listMeta: { fontFamily: fonts.regular, fontSize: 12, color: appShell.textMuted },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetCard: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, gap: spacing.sm },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 18, color: appShell.textPrimary },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sheetCopy: { flex: 1 },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
  autoDmPill: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: appShell.canvasAlt,
  },
  autoDmText: { fontFamily: fonts.semiBold, fontSize: 10, color: appShell.cta },
  failedPill: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: '#FEF3C7',
  },
  failedPillText: { fontFamily: fonts.semiBold, fontSize: 10, color: '#B45309' },
});
