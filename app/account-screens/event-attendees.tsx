import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  KollabButton,
  KollabEmptyCard,
  KollabScreenHeader,
  KollabStatusChip,
  KollabTextField,
  ScrollScreen,
  showKollabToast,
} from '@/components/ui';
import { eventsApi, type Attendee } from '@/lib/events-api';
import { font, useKollab } from '@/theme/kollab-tokens';

type Filter = 'all' | 'in' | 'not_yet';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'not_yet', label: 'Not yet' },
  { key: 'in', label: 'Checked in' },
];

export default function EventAttendeesScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = typeof id === 'string' ? id : '';

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) {
      setError('Event not found');
      setLoading(false);
      return;
    }
    try {
      const res = await eventsApi.attendees(eventId);
      setAttendees(res.attendees);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the attendee list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const toggle = async (a: Attendee) => {
    if (busy || a.status === 'cancelled') return;
    const next = a.status !== 'checked_in';
    setBusy(a.id);
    try {
      await eventsApi.setTicketCheckedIn(eventId, a.id, next);
      setAttendees((list) =>
        list.map((x) =>
          x.id === a.id
            ? {
                ...x,
                status: next ? 'checked_in' : 'valid',
                checkedInAt: next ? new Date().toISOString() : null,
              }
            : x
        )
      );
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not update this ticket');
    } finally {
      setBusy(null);
    }
  };

  const active = attendees.filter((a) => a.status !== 'cancelled');
  const checkedIn = active.filter((a) => a.status === 'checked_in').length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return attendees.filter((a) => {
      if (filter === 'in' && a.status !== 'checked_in') return false;
      if (filter === 'not_yet' && a.status !== 'valid') return false;
      if (!q) return true;
      return [a.attendeeName, a.buyerEmail, a.code, a.passName].some((v) =>
        v.toLowerCase().includes(q)
      );
    });
  }, [attendees, query, filter]);

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{
        keyboardShouldPersistTaps: 'handled',
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
      <KollabScreenHeader
        title="Attendees"
        subtitle={`${checkedIn} of ${active.length} checked in`}
      />
      <KollabButton
        label="Scan tickets"
        variant="primary"
        onPress={() => router.push(`/account-screens/event-scanner?id=${eventId}` as never)}
        style={styles.scan}
      />
      <KollabTextField
        surface="card"
        value={query}
        onChangeText={setQuery}
        placeholder="Search name, email, pass or code"
        autoCorrect={false}
        style={styles.search}
      />
      <View style={styles.filters}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          const spec = kollab.choiceChip;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: on ? spec.selectedBg : spec.idleBg,
                  borderColor: on ? spec.selectedBorder : spec.idleBorder,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.chipText, { color: on ? spec.selectedFg : spec.idleFg }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={c.ink} style={{ marginTop: 24 }} />
      ) : error ? (
        <KollabEmptyCard
          title="Couldn’t load attendees"
          subtitle={error}
          ctaLabel="Try again"
          onPress={() => {
            setLoading(true);
            void load();
          }}
          style={{ marginHorizontal: 0 }}
        />
      ) : attendees.length === 0 ? (
        <KollabEmptyCard
          title="No attendees yet"
          subtitle="People who book a ticket appear here, ready to check in."
          ctaLabel="Back"
          onPress={() => router.back()}
          style={{ marginHorizontal: 0 }}
        />
      ) : visible.length === 0 ? (
        <Text style={[styles.none, { color: c.ink }]}>No one matches this filter or search.</Text>
      ) : (
        <View style={styles.list}>
          {visible.map((a) => (
            <View key={a.id} style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.name, { color: c.ink }]} numberOfLines={1}>
                  {a.attendeeName}
                </Text>
                <Text style={[styles.meta, { color: c.ink }]} numberOfLines={1}>
                  {a.passName} · {a.code}
                </Text>
                <Text style={[styles.meta, { color: c.ink }]} numberOfLines={1}>
                  {a.buyerEmail}
                </Text>
              </View>
              {a.status === 'cancelled' ? (
                <KollabStatusChip tone="neutral" label="Cancelled" />
              ) : (
                <KollabButton
                  label={a.status === 'checked_in' ? 'Undo' : 'Check in'}
                  variant={a.status === 'checked_in' ? 'hairline' : 'ink'}
                  compact
                  loading={busy === a.id}
                  onPress={() => void toggle(a)}
                />
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  scan: { marginBottom: 10 },
  search: { marginBottom: 10 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontFamily: font.semiBold, fontSize: 12.5 },
  none: {
    fontFamily: font.body,
    fontSize: 13.5,
    opacity: 0.55,
    textAlign: 'center',
    marginTop: 20,
  },
  list: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14 },
  name: { fontFamily: font.bold, fontSize: 15 },
  meta: { fontFamily: font.body, fontSize: 12.5, opacity: 0.55 },
});
