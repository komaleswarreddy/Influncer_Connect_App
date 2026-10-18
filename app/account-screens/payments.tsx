import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { ugcApi } from '@/lib/ugc-api';
import { ScrollScreen, KollabScreenHeader, KollabSectionLabel, Glyph } from '@/components/ui';
import { useCampaignStore } from '@/store/campaign-store';
import { ReferralEarningsCard } from '@/components/referrals/ReferralEarningsCard';
import { sumPotentialEarningsFromEligible } from '@/lib/home-potential-earnings';
import { getActiveParticipations, participationCampaignId } from '@/lib/home-existing-user';
import { formatInr } from '@/lib/currency';
import { useKollab, font, space } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';

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

function splitInr(amount: number): { main: string; frac: string | null } {
  const s = formatInr(amount, { decimals: 2 });
  const i = s.lastIndexOf('.');
  if (i < 0) return { main: s, frac: null };
  return { main: s.slice(0, i), frac: s.slice(i) };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function formatPaidDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PaymentsScreen() {
  const kollab = useKollab();
  const styles = useStyles(kollab);
  const router = useRouter();
  const { campaigns, participations, fetchCampaigns, fetchParticipations } = useCampaignStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [summary, setSummary] = useState({ paidTotal: 0, currency: 'INR' });
  const [ugcTotal, setUgcTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [payoutRes, ugcRes] = await Promise.all([
        api.get('/api/payments/influencer/my') as Promise<MyPayoutsResponse>,
        ugcApi.myEarnings().catch(() => ({ earnings: [], total: 0 })) as Promise<{
          total?: number;
        }>,
        fetchCampaigns(),
        fetchParticipations(),
      ]);

      setPayouts(Array.isArray(payoutRes.payouts) ? payoutRes.payouts : []);
      if (payoutRes.summary) {
        setSummary({
          paidTotal: Number(payoutRes.summary.paidTotal ?? 0),
          currency: payoutRes.summary.currency ?? 'INR',
        });
      }
      setUgcTotal(Number(ugcRes?.total ?? 0));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load payments';
      setError(msg);
      setPayouts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchCampaigns, fetchParticipations]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const enrolledIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of participations) {
      const id = participationCampaignId(p).toLowerCase();
      if (id) ids.add(id);
    }
    return ids;
  }, [participations]);

  const potential = useMemo(
    () => sumPotentialEarningsFromEligible({ campaigns, enrolledCampaignIds: enrolledIds }),
    [campaigns, enrolledIds]
  );
  const eligibleCount = useMemo(() => {
    let n = 0;
    for (const c of campaigns) {
      const id = String(c.id ?? '')
        .trim()
        .toLowerCase();
      if (!id) continue;
      if (String(c.status ?? '').toLowerCase() !== 'active') continue;
      if (enrolledIds.has(id)) continue;
      n += 1;
    }
    return n;
  }, [campaigns, enrolledIds]);
  const activeCount = getActiveParticipations(participations).length;
  const received = splitInr(summary.paidTotal);

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
      <KollabScreenHeader title="Payments" subtitle="Brand payouts, UGC and referral earnings" />

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={kollab.color.ink} style={{ marginTop: 24 }} />
      ) : null}
      {error ? <Text style={[styles.error, { color: kollab.color.heat }]}>{error}</Text> : null}

      <View style={[styles.panel, { backgroundColor: kollab.color.panel }]}>
        <Text style={[styles.panelLabel, { color: kollab.color.panelInk }]}>Total received</Text>
        <Text style={[styles.panelValue, { color: kollab.color.panelInk }]}>
          {received.main}
          {received.frac ? <Text style={styles.panelFrac}>{received.frac}</Text> : null}
        </Text>
        <Text style={[styles.panelHint, { color: kollab.color.panelInk }]}>
          Recorded by brands for your work
        </Text>
      </View>

      <View style={[styles.potential, { backgroundColor: kollab.color.tint }]}>
        <View style={[styles.potWell, { backgroundColor: kollab.color.violet }]}>
          <Glyph name="check" color={kollab.color.inkOn} size={20} />
        </View>
        <View style={styles.potCopy}>
          <Text style={[styles.potTitle, { color: kollab.color.ink }]}>
            {formatInr(potential)} potential
          </Text>
          <Text style={[styles.potHint, { color: kollab.color.ink }]}>
            Across {eligibleCount} eligible collab{eligibleCount === 1 ? '' : 's'}
          </Text>
        </View>
        <Text style={[styles.potActive, { color: kollab.color.violet }]}>{activeCount} active</Text>
      </View>

      <KollabSectionLabel label="brand payouts" />
      {payouts.length === 0 && !loading ? (
        <Text style={[styles.empty, { color: kollab.color.ink }]}>
          No brand payouts yet. When a brand records a payment, it will show here.
        </Text>
      ) : null}
      <View style={styles.payoutList}>
        {payouts.map((p) => {
          const name = p.campaignName || 'Payout';
          const when = formatPaidDate(p.paidAt);
          const meta = [when, p.status].filter(Boolean).join(' · ');
          return (
            <View
              key={p.id}
              style={[styles.payout, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
            >
              <View style={[styles.letter, { backgroundColor: kollab.color.violet }]}>
                <Text style={[styles.letterText, { color: kollab.color.inkOn }]}>
                  {initials(name)}
                </Text>
              </View>
              <View style={styles.payoutCopy}>
                <Text style={[styles.payoutName, { color: kollab.color.ink }]} numberOfLines={1}>
                  {name}
                </Text>
                {meta ? (
                  <Text style={[styles.payoutMeta, { color: kollab.color.ink }]}>{meta}</Text>
                ) : null}
              </View>
              <Text style={[styles.payoutAmt, { color: kollab.color.teal }]}>
                +{formatInr(Number(p.amount))}
              </Text>
            </View>
          );
        })}
      </View>

      <KollabSectionLabel label="ugc earnings" />
      <View style={[styles.ugcCard, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
        <View style={styles.ugcRow}>
          <Text style={[styles.ugcLabel, { color: kollab.color.ink }]}>Total earned</Text>
          <Text style={[styles.ugcValue, { color: kollab.color.ink }]}>{formatInr(ugcTotal)}</Text>
        </View>
        <Text style={[styles.ugcNote, { color: kollab.color.ink }]}>
          {ugcTotal > 0
            ? 'Paid and pending UGC work lands here.'
            : 'No UGC earnings yet. Paid and pending UGC work lands here.'}
        </Text>
        <Pressable
          onPress={() => router.push('/account-screens/ugc-earnings' as never)}
          accessibilityRole="button"
        >
          <Text style={[styles.ugcLink, { color: kollab.color.violet }]}>View UGC earnings →</Text>
        </Pressable>
      </View>

      <KollabSectionLabel label="referral rewards" />
      <ReferralEarningsCard />
    </ScrollScreen>
  );
}

function useStyles(kollab: KollabTokens) {
  return useMemo(
    () =>
      StyleSheet.create({
        panel: {
          borderRadius: 24,
          padding: 22,
          marginBottom: 16,
        },
        panelLabel: {
          fontFamily: font.body,
          fontSize: 12,
          opacity: 0.6,
        },
        panelValue: {
          fontFamily: font.display,
          fontSize: 44,
          marginTop: 2,
          marginBottom: 4,
        },
        panelFrac: {
          fontSize: 24,
          opacity: 0.45,
        },
        panelHint: {
          fontFamily: font.body,
          fontSize: 12,
          opacity: 0.6,
        },
        potential: {
          borderRadius: 20,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
        },
        potWell: {
          width: 42,
          height: 42,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        potCopy: { flex: 1, minWidth: 0 },
        potTitle: {
          fontFamily: font.semiBold,
          fontSize: 14,
        },
        potHint: {
          fontFamily: font.body,
          fontSize: 12,
          opacity: 0.6,
        },
        potActive: {
          fontFamily: font.bold,
          fontSize: 12,
        },
        payoutList: { gap: 9, marginBottom: 22 },
        payout: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: 17,
          paddingVertical: 13,
          paddingHorizontal: 15,
        },
        letter: {
          width: 38,
          height: 38,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        letterText: {
          fontFamily: font.bold,
          fontSize: 12,
        },
        payoutCopy: { flex: 1, minWidth: 0 },
        payoutName: {
          fontFamily: font.semiBold,
          fontSize: 13.5,
        },
        payoutMeta: {
          fontFamily: font.body,
          fontSize: 11.5,
          opacity: 0.55,
          textTransform: 'capitalize',
        },
        payoutAmt: {
          fontFamily: font.bold,
          fontSize: 14,
          flexShrink: 0,
        },
        ugcCard: {
          borderRadius: 20,
          padding: 18,
        },
        ugcRow: {
          flexDirection: 'row',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        },
        ugcLabel: {
          fontFamily: font.body,
          fontSize: 12,
          opacity: 0.55,
        },
        ugcValue: {
          fontFamily: font.display,
          fontSize: 26,
        },
        ugcNote: {
          fontFamily: font.body,
          fontSize: 12.5,
          opacity: 0.55,
          marginTop: 8,
          lineHeight: 18,
        },
        ugcLink: {
          fontFamily: font.semiBold,
          fontSize: 13,
          marginTop: 10,
        },
        empty: {
          fontFamily: font.body,
          fontSize: 13,
          opacity: 0.55,
          lineHeight: 19,
          marginBottom: 12,
        },
        error: {
          fontFamily: font.body,
          fontSize: 14,
          marginBottom: 12,
        },
      }),
    [kollab]
  );
}
