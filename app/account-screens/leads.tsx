import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import {
  KollabButton,
  KollabEmptyCard,
  KollabScreenHeader,
  KollabStatTile,
  KollabStatusChip,
  KollabTextField,
  ScrollScreen,
} from '@/components/ui';
import {
  LEAD_STAGES,
  leadsApi,
  type Lead,
  type LeadFilter,
  type LeadSummary,
} from '@/lib/leads-api';
import { LEAD_STAGE_UI, timeAgo } from '@/lib/leads-ui';
import { formatInr } from '@/lib/currency';
import { font, useKollab } from '@/theme/kollab-tokens';

const EMPTY: LeadSummary = {
  total: 0,
  new: 0,
  contacted: 0,
  won: 0,
  lost: 0,
  unread: 0,
  wonValue: 0,
};

export default function LeadsScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [summary, setSummary] = useState<LeadSummary>(EMPTY);
  const [filter, setFilter] = useState<LeadFilter>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards against a slow earlier response overwriting a newer filter/search.
  const requestSeq = useRef(0);

  const load = useCallback(async (nextFilter: LeadFilter, q: string) => {
    const seq = ++requestSeq.current;
    try {
      const res = await leadsApi.list({ stage: nextFilter, q, limit: 100 });
      if (seq !== requestSeq.current) return;
      setLeads(res.leads);
      setSummary(res.summary);
      setError(null);
    } catch (e) {
      if (seq !== requestSeq.current) return;
      setError(e instanceof Error ? e.message : 'Could not load your leads');
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(filter, query);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load, filter])
  );

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => void load(filter, query), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const counts: Record<LeadFilter, number> = {
    all: summary.total,
    new: summary.new,
    contacted: summary.contacted,
    won: summary.won,
    lost: summary.lost,
  };

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
              void load(filter, query);
            }}
          />
        ),
      }}
    >
      <KollabScreenHeader title="Leads" subtitle="Brand enquiries and collaborations" />

      <View style={styles.tiles}>
        <KollabStatTile
          label="New"
          value={String(summary.new)}
          delta={summary.unread > 0 ? `${summary.unread} unread` : 'all caught up'}
          fill="dark"
          style={styles.tile}
        />
        <KollabStatTile
          label="Won"
          value={formatInr(summary.wonValue)}
          delta={`${summary.won} deal${summary.won === 1 ? '' : 's'}`}
          fill="tint"
          style={styles.tile}
        />
      </View>

      <KollabButton
        label="Add a lead"
        variant="ink"
        onPress={() => router.push('/account-screens/lead-form' as never)}
        style={styles.add}
      />

      <KollabTextField
        surface="card"
        value={query}
        onChangeText={setQuery}
        placeholder="Search name, company, email or message"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.search}
      />

      <View style={styles.filters}>
        {[{ key: 'all' as LeadFilter, label: 'All' }, ...LEAD_STAGES].map((f) => {
          const on = filter === f.key;
          const spec = kollab.choiceChip;
          return (
            <Pressable
              key={f.key}
              onPress={() => {
                setFilter(f.key as LeadFilter);
              }}
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
                {f.label} · {counts[f.key as LeadFilter]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={c.ink} style={{ marginTop: 24 }} />
      ) : error && leads.length === 0 ? (
        <KollabEmptyCard
          title="Couldn’t load your leads"
          subtitle={error}
          ctaLabel="Try again"
          onPress={() => {
            setLoading(true);
            void load(filter, query);
          }}
          style={styles.empty}
        />
      ) : leads.length === 0 ? (
        summary.total === 0 ? (
          <KollabEmptyCard
            title="No leads yet"
            subtitle="Publish your Brand Kit and brands can send you enquiries straight from your link. You can also add leads yourself."
            ctaLabel="Open Brand Kit"
            onPress={() => router.push('/account-screens/brand-kit' as never)}
            style={styles.empty}
          />
        ) : (
          <Text style={[styles.none, { color: c.ink }]}>No leads match this filter or search.</Text>
        )
      ) : (
        <View style={styles.list}>
          {leads.map((lead) => {
            const ui = LEAD_STAGE_UI[lead.stage];
            return (
              <Pressable
                key={lead.id}
                onPress={() => router.push(`/account-screens/lead-detail?id=${lead.id}` as never)}
                style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}
                accessibilityRole="button"
                accessibilityLabel={`${lead.name}${lead.company ? `, ${lead.company}` : ''}, ${ui.label}${lead.isRead ? '' : ', unread'}`}
              >
                <View style={styles.cardTop}>
                  {!lead.isRead ? (
                    <View style={[styles.dot, { backgroundColor: c.violet }]} />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: c.ink }]} numberOfLines={1}>
                      {lead.name}
                    </Text>
                    {lead.company ? (
                      <Text style={[styles.meta, { color: c.ink }]} numberOfLines={1}>
                        {lead.company}
                      </Text>
                    ) : null}
                  </View>
                  <KollabStatusChip tone={ui.tone} label={ui.label} />
                </View>
                {lead.message ? (
                  <Text style={[styles.preview, { color: c.ink }]} numberOfLines={2}>
                    {lead.message}
                  </Text>
                ) : null}
                <View style={styles.cardBottom}>
                  <Text style={[styles.meta, { color: c.ink }]}>
                    {timeAgo(lead.createdAt)}
                    {lead.source === 'media_kit' ? ' · from your kit' : ''}
                  </Text>
                  {lead.budgetText ? (
                    <Text style={[styles.budget, { color: c.violetDeep }]}>{lead.budgetText}</Text>
                  ) : null}
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
  tiles: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  tile: { flex: 1 },
  add: { marginBottom: 12 },
  search: { marginBottom: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 },
  chipText: { fontFamily: font.semiBold, fontSize: 12.5 },
  empty: { marginHorizontal: 0 },
  none: {
    fontFamily: font.body,
    fontSize: 13.5,
    opacity: 0.55,
    textAlign: 'center',
    marginTop: 20,
  },
  list: { gap: 10 },
  card: { borderRadius: 20, padding: 15, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  name: { fontFamily: font.bold, fontSize: 15.5 },
  meta: { fontFamily: font.body, fontSize: 12.5, opacity: 0.55 },
  preview: { fontFamily: font.body, fontSize: 13.5, opacity: 0.75, lineHeight: 19 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budget: { fontFamily: font.bold, fontSize: 13 },
});
