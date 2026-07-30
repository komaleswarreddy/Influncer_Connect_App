import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '@/lib/api';
import { ugcApi } from '@/lib/ugc-api';
import { ScrollScreen, SectionHeader, PremiumCard } from '@/components/ui';
import { appShell, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';

type PayoutItem = {
  id: string;
  amount: string;
  currency: string;
  status: string;
  paidAt: string | null;
  campaignName: string | null;
};

type MyPayoutsResponse = {
  success?: boolean;
  payouts?: PayoutItem[];
  summary?: { paidTotal: number; currency: string };
};

type UgcEarningsRow = {
  briefTitle?: string;
  amount?: number;
  currency?: string;
  status?: string;
};

export default function PaymentsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [summary, setSummary] = useState({ paidTotal: 0, currency: 'USD' });
  const [ugcRows, setUgcRows] = useState<UgcEarningsRow[]>([]);
  const [ugcTotal, setUgcTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [payoutRes, ugcRes] = await Promise.all([
        api.get('/api/payments/influencer/my') as Promise<MyPayoutsResponse>,
        ugcApi.myEarnings().catch(() => ({ earnings: [], total: 0 })) as Promise<{
          earnings?: UgcEarningsRow[];
          total?: number;
        }>,
      ]);

      setPayouts(Array.isArray(payoutRes.payouts) ? payoutRes.payouts : []);
      if (payoutRes.summary) {
        setSummary({
          paidTotal: Number(payoutRes.summary.paidTotal ?? 0),
          currency: payoutRes.summary.currency ?? 'USD',
        });
      }
      setUgcRows(Array.isArray(ugcRes?.earnings) ? ugcRes.earnings : []);
      setUgcTotal(Number(ugcRes?.total ?? 0));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load payments';
      setError(msg);
      setPayouts([]);
      setUgcRows([]);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
  };

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{
        refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />,
      }}
    >
      <SectionHeader title="Payments" subtitle="Brand payouts and UGC earnings" />
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={appShell.cta} style={{ marginTop: 24 }} />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SectionHeader title="Brand payouts" subtitle="Recorded by brands for your work" />
      <PremiumCard style={{ marginBottom: spacing.sm }}>
        <Text style={styles.summaryLabel}>Total received</Text>
        <Text style={styles.summaryValue}>
          {summary.currency}{' '}
          {summary.paidTotal.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      </PremiumCard>
      {payouts.length === 0 && !loading ? (
        <Text style={styles.empty}>
          No brand payouts yet. When a brand records a payment, it will show here.
        </Text>
      ) : null}
      {payouts.map((p) => (
        <PremiumCard key={p.id} style={{ marginBottom: spacing.sm }}>
          <View style={styles.row}>
            <Text style={styles.campaignTitle}>{p.campaignName || 'Payout'}</Text>
            <Text style={styles.badge}>{p.status}</Text>
          </View>
          <Text style={styles.amount}>
            {p.currency}{' '}
            {Number(p.amount).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
          {p.paidAt ? <Text style={styles.meta}>{new Date(p.paidAt).toLocaleString()}</Text> : null}
        </PremiumCard>
      ))}

      <SectionHeader title="UGC earnings" subtitle="Paid and pending UGC work" />
      <PremiumCard style={{ marginBottom: spacing.sm }}>
        <Text style={styles.summaryLabel}>Total earned</Text>
        <Text style={styles.summaryValue}>₹{ugcTotal.toLocaleString()}</Text>
      </PremiumCard>
      {ugcRows.length === 0 && !loading ? (
        <Text style={styles.empty}>No UGC earnings yet.</Text>
      ) : null}
      {ugcRows.map((r, i) => (
        <PremiumCard key={`ugc-${i}`} style={{ marginBottom: spacing.sm }}>
          <Text style={styles.campaignTitle}>{r.briefTitle || 'UGC brief'}</Text>
          <Text style={styles.meta}>
            {r.currency || 'INR'} {Number(r.amount ?? 0).toLocaleString()} · {r.status || 'pending'}
          </Text>
        </PremiumCard>
      ))}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  summaryLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: appShell.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: appShell.cta,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  campaignTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: appShell.textPrimary,
    flex: 1,
  },
  badge: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: appShell.textMuted,
    textTransform: 'capitalize',
  },
  amount: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: appShell.textPrimary,
    marginBottom: 4,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: appShell.textMuted,
    marginTop: spacing.xxs,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: appShell.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    lineHeight: 21,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#b91c1c',
    marginBottom: spacing.sm,
  },
});
