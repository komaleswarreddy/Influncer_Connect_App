import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScrollScreen, KollabScreenHeader, KollabButton } from '@/components/ui';
import { ugcApi } from '@/lib/ugc-api';
import { formatInr } from '@/lib/currency';
import { useKollab, font, space } from '@/theme/kollab-tokens';

type UgcEarningsRow = {
  briefTitle?: string;
  amount?: number;
  status?: string;
};

export default function UgcEarningsScreen() {
  const kollab = useKollab();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<UgcEarningsRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = (await ugcApi.myEarnings()) as {
        earnings?: UgcEarningsRow[];
        total?: number;
      };
      setRows(Array.isArray(res?.earnings) ? res.earnings : []);
      setTotal(Number(res?.total ?? 0));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load UGC earnings');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  return (
    <ScrollScreen
      padH={space.gutter}
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
      <KollabScreenHeader title="UGC earnings" subtitle="Paid and pending UGC work" />

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={kollab.color.ink} style={{ marginTop: 24 }} />
      ) : null}
      {error ? <Text style={[styles.error, { color: kollab.color.heat }]}>{error}</Text> : null}

      <View style={[styles.panel, { backgroundColor: kollab.color.panel }]}>
        <Text style={[styles.label, { color: kollab.color.panelInk }]}>Total earned</Text>
        <Text style={[styles.value, { color: kollab.color.panelInk }]}>{formatInr(total)}</Text>
        <Text style={[styles.hint, { color: kollab.color.panelInk }]}>
          Apply to a public brief and your payouts will show up here.
        </Text>
        <KollabButton
          label="Browse briefs"
          onPress={() => router.push('/influencer/campaigns' as never)}
          style={styles.cta}
        />
      </View>

      {rows.length > 0 ? (
        <View style={styles.list}>
          {rows.map((r, i) => (
            <View
              key={`ugc-${i}`}
              style={[styles.row, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
            >
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: kollab.color.ink }]} numberOfLines={1}>
                  {r.briefTitle || 'UGC brief'}
                </Text>
                <Text style={[styles.rowMeta, { color: kollab.color.ink }]}>
                  {r.status || 'pending'}
                </Text>
              </View>
              <Text style={[styles.rowAmt, { color: kollab.color.teal }]}>
                +{formatInr(Number(r.amount ?? 0))}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 26,
    padding: 24,
  },
  label: {
    fontFamily: font.body,
    fontSize: 12,
    opacity: 0.6,
  },
  value: {
    fontFamily: font.display,
    fontSize: 46,
    marginTop: 2,
    marginBottom: 8,
  },
  hint: {
    fontFamily: font.body,
    fontSize: 13,
    opacity: 0.6,
    lineHeight: 19.5,
    maxWidth: 250,
  },
  cta: {
    marginTop: 18,
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  list: {
    marginTop: 18,
    gap: 9,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 17,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontFamily: font.semiBold,
    fontSize: 13.5,
  },
  rowMeta: {
    fontFamily: font.body,
    fontSize: 11.5,
    opacity: 0.55,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  rowAmt: {
    fontFamily: font.bold,
    fontSize: 14,
  },
  error: {
    fontFamily: font.body,
    fontSize: 14,
    marginBottom: 12,
  },
});
