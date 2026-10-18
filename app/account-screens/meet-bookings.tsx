import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import {
  KollabEmptyCard,
  KollabScreenHeader,
  KollabSegmented,
  KollabStatusChip,
  ScrollScreen,
} from '@/components/ui';
import { meetsApi, type MeetBooking } from '@/lib/meets-api';
import { BOOKING_STATUS_UI, formatSessionRange } from '@/lib/meets-ui';
import { formatInr } from '@/lib/currency';
import { font, useKollab } from '@/theme/kollab-tokens';

type Scope = 'upcoming' | 'past';

export default function MeetBookingsScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const [scope, setScope] = useState<Scope>('upcoming');
  const [bookings, setBookings] = useState<MeetBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (which: Scope) => {
    try {
      setBookings((await meetsApi.bookings(which)).bookings);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(scope);
    }, [load, scope])
  );

  const switchScope = (next: string) => {
    setLoading(true);
    setScope(next as Scope);
  };

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(scope);
            }}
          />
        ),
      }}
    >
      <KollabScreenHeader title="Bookings" subtitle="Sessions people have booked with you" />
      <KollabSegmented
        segments={[
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'past', label: 'Past' },
        ]}
        value={scope}
        onChange={switchScope}
        style={{ marginBottom: 12 }}
      />

      {loading ? (
        <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />
      ) : error && bookings.length === 0 ? (
        <KollabEmptyCard
          title="Couldn’t load your bookings"
          subtitle={error}
          ctaLabel="Try again"
          onPress={() => {
            setLoading(true);
            void load(scope);
          }}
          style={{ marginHorizontal: 0 }}
        />
      ) : bookings.length === 0 ? (
        <KollabEmptyCard
          title={scope === 'upcoming' ? 'No upcoming sessions' : 'No past sessions yet'}
          subtitle={
            scope === 'upcoming'
              ? 'Share your booking link and sessions will show up here.'
              : 'Completed and cancelled sessions appear here.'
          }
          ctaLabel="Open Meet scheduler"
          onPress={() => router.push('/account-screens/meets' as never)}
          style={{ marginHorizontal: 0 }}
        />
      ) : (
        <View style={styles.list}>
          {bookings.map((b) => {
            const ui = BOOKING_STATUS_UI[b.status];
            return (
              <Pressable
                key={b.id}
                onPress={() =>
                  router.push(`/account-screens/meet-booking-detail?id=${b.id}` as never)
                }
                accessibilityRole="button"
                accessibilityLabel={`${b.buyerName}, ${ui.label}`}
                style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}
              >
                <View style={styles.top}>
                  <Text style={[styles.title, { color: c.ink }]} numberOfLines={1}>
                    {b.buyerName}
                  </Text>
                  <KollabStatusChip tone={ui.tone} label={ui.label} />
                </View>
                <Text style={[styles.meta, { color: c.ink }]}>{b.serviceTitle}</Text>
                <Text style={[styles.when, { color: c.violetDeep }]}>
                  {formatSessionRange(b.startsAt, b.endsAt)}
                </Text>
                <Text style={[styles.meta, { color: c.ink }]}>
                  {b.totalAmount > 0 ? formatInr(b.totalAmount) : 'Free'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: { borderRadius: 20, padding: 15, gap: 4 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontFamily: font.bold, fontSize: 16.5 },
  meta: { fontFamily: font.body, fontSize: 13, opacity: 0.65 },
  when: { fontFamily: font.bold, fontSize: 13.5, marginTop: 2 },
});
