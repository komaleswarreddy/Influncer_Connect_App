import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScrollScreen, SectionHeader, PremiumCard } from '@/components/ui';
import { ugcApi } from '@/lib/ugc-api';
import { appShell, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';

type EarningsRow = { briefTitle?: string; amount?: number; currency?: string; status?: string };

export default function UgcEarningsScreen() {
  const [rows, setRows] = useState<EarningsRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      void ugcApi
        .myEarnings()
        .then((res: { earnings?: EarningsRow[]; total?: number }) => {
          if (!active) return;
          setRows(res?.earnings ?? []);
          setTotal(Number(res?.total ?? 0));
          setError(null);
        })
        .catch((e: unknown) => {
          if (!active) return;
          setError(e instanceof Error ? e.message : 'Could not load earnings');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title="UGC earnings" subtitle="Paid and pending UGC work" />
      {loading ? <ActivityIndicator color={appShell.cta} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PremiumCard>
        <Text style={styles.totalLabel}>Total earned</Text>
        <Text style={styles.total}>₹{total.toLocaleString()}</Text>
      </PremiumCard>
      {rows.map((r, i) => (
        <PremiumCard key={i} style={{ marginTop: spacing.sm }}>
          <Text style={styles.title}>{r.briefTitle || 'UGC brief'}</Text>
          <Text style={styles.meta}>
            {r.currency || 'INR'} {Number(r.amount ?? 0).toLocaleString()} · {r.status || 'pending'}
          </Text>
        </PremiumCard>
      ))}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  totalLabel: { fontFamily: fonts.regular, fontSize: 13, color: appShell.textSecondary },
  total: { fontFamily: fonts.semiBold, fontSize: 28, color: appShell.textPrimary },
  title: { fontFamily: fonts.semiBold, fontSize: 15, color: appShell.textPrimary },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: appShell.textMuted, marginTop: spacing.xxs },
  error: { fontFamily: fonts.regular, color: appShell.error, marginBottom: spacing.sm },
});
