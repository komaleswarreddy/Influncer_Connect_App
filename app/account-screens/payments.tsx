import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '@/lib/api';
import { ScrollScreen, SectionHeader, PremiumCard } from '@/components/ui';
import { appShell, spacing, radius } from '@/theme';
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

export default function PaymentsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [summary, setSummary] = useState({ paidTotal: 0, currency: 'USD' });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = (await api.get('/api/payments/influencer/my')) as MyPayoutsResponse;
      setPayouts(Array.isArray(data.payouts) ? data.payouts : []);
      if (data.summary) {
        setSummary({
          paidTotal: Number(data.summary.paidTotal ?? 0),
          currency: data.summary.currency ?? 'USD',
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load payments';
      setError(msg);
      setPayouts([]);
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
      <SectionHeader title="Payments" subtitle="Payouts recorded by brands for your work" />
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={appShell.cta} style={{ marginTop: 24 }} />
      ) : null}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
      <PremiumCard style={{ marginBottom: spacing.sm }}>
        <Text style={styles.summaryLabel}>Total received</Text>
        <Text style={styles.summaryValue}>
          {summary.currency} {summary.paidTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </PremiumCard>
      {payouts.length === 0 && !loading ? (
        <Text style={styles.empty}>No payouts yet. When a brand records a payment, it will show here.</Text>
      ) : null}
      {payouts.map((p) => (
        <PremiumCard key={p.id} style={{ marginBottom: spacing.sm }}>
          <View style={styles.row}>
            <Text style={styles.campaignTitle}>{p.campaignName || 'Payout'}</Text>
            <Text style={styles.badge}>{p.status}</Text>
          </View>
          <Text style={styles.amount}>
            {p.currency} {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          {p.paidAt ? (
            <Text style={styles.meta}>{new Date(p.paidAt).toLocaleString()}</Text>
          ) : null}
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
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: appShell.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: '#b91c1c',
    marginBottom: spacing.sm,
  },
});
