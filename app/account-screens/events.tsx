import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  KollabButton,
  KollabEmptyCard,
  KollabScreenHeader,
  KollabStatusChip,
  ScrollScreen,
} from '@/components/ui';
import { eventsApi, type EventListItem } from '@/lib/events-api';
import { EVENT_STATUS_UI, formatEventRange } from '@/lib/events-ui';
import { formatInr } from '@/lib/currency';
import { font, useKollab } from '@/theme/kollab-tokens';

const FEATURES: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string }[] = [
  { icon: 'ticket-outline', title: 'Sell tickets' },
  { icon: 'card-outline', title: 'Collect payments' },
  { icon: 'people-outline', title: 'Invite & manage' },
  { icon: 'qr-code-outline', title: 'Hassle-free check-ins' },
];

export default function EventsScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await eventsApi.list();
      setEvents(res.events);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const create = () => router.push('/account-screens/event-form' as never);

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        ),
      }}
    >
      <KollabScreenHeader title="Events" subtitle="Host events and sell tickets" />

      {loading ? (
        <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />
      ) : error && events.length === 0 ? (
        <KollabEmptyCard
          title="Couldn’t load your events"
          subtitle={error}
          ctaLabel="Try again"
          onPress={() => {
            setLoading(true);
            void load();
          }}
          style={{ marginHorizontal: 0 }}
        />
      ) : events.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: c.ink }]}>NO EVENTS YET</Text>
          <Text style={[styles.emptySub, { color: c.ink }]}>
            Create your first event and start selling.
          </Text>
          <View style={styles.grid}>
            {FEATURES.map((f) => (
              <View
                key={f.title}
                style={[styles.feature, { backgroundColor: c.card }, kollab.shadow.card]}
              >
                <View style={[styles.featureIcon, { backgroundColor: c.well }]}>
                  <Ionicons name={f.icon} size={24} color={c.violetDeep} />
                </View>
                <Text style={[styles.featureText, { color: c.ink }]}>{f.title}</Text>
              </View>
            ))}
          </View>
          <KollabButton label="Create event" variant="primary" onPress={create} />
        </View>
      ) : (
        <View style={styles.list}>
          <KollabButton label="Create event" variant="ink" onPress={create} />
          {events.map((ev) => {
            const ui = EVENT_STATUS_UI[ev.displayStatus];
            return (
              <Pressable
                key={ev.id}
                onPress={() => router.push(`/account-screens/event-detail?id=${ev.id}` as never)}
                style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}
                accessibilityRole="button"
                accessibilityLabel={`${ev.title}, ${ui.label}`}
              >
                {ev.bannerUrl ? (
                  <Image source={{ uri: ev.bannerUrl }} style={styles.banner} contentFit="cover" />
                ) : null}
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.title, { color: c.ink }]} numberOfLines={2}>
                      {ev.title}
                    </Text>
                    <KollabStatusChip tone={ui.tone} label={ui.label} />
                  </View>
                  <Text style={[styles.meta, { color: c.ink }]}>
                    {formatEventRange(ev.startsAt, ev.endsAt)}
                  </Text>
                  <Text style={[styles.meta, { color: c.ink }]} numberOfLines={1}>
                    {ev.isOnline ? 'Online' : ev.venueName || ev.address || 'Venue not set'}
                  </Text>
                  <View style={styles.stats}>
                    <Text style={[styles.stat, { color: c.violetDeep }]}>
                      {ev.ticketsSold} / {ev.capacity} sold
                    </Text>
                    {ev.revenue > 0 ? (
                      <Text style={[styles.stat, { color: c.teal }]}>{formatInr(ev.revenue)}</Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: 12, paddingTop: 8 },
  emptyTitle: { fontFamily: font.display, fontSize: 30, letterSpacing: 1 },
  emptySub: {
    fontFamily: font.body,
    fontSize: 15,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  feature: { width: '47.5%', borderRadius: 22, paddingVertical: 22, alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontFamily: font.bold, fontSize: 14.5, textAlign: 'center' },
  list: { gap: 12 },
  card: { borderRadius: 22, overflow: 'hidden' },
  banner: { width: '100%', aspectRatio: 16 / 9 },
  cardBody: { padding: 15, gap: 5 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    justifyContent: 'space-between',
  },
  title: { flex: 1, fontFamily: font.bold, fontSize: 17 },
  meta: { fontFamily: font.body, fontSize: 13, opacity: 0.6 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  stat: { fontFamily: font.bold, fontSize: 13.5 },
});
