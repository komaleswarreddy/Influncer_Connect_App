import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { referralsApi, type ReferralOverview } from '@/lib/referrals-api';
import { formatInr } from '@/lib/currency';
import { font, useKollab } from '@/theme/kollab-tokens';

/**
 * Referral rewards summary for the Payments screen. Loads its own data and stays quiet on failure: a referral hiccup must
 * never break the rest of Payments.
 */
export function ReferralEarningsCard() {
  const kollab = useKollab();
  const c = kollab.color;
  const router = useRouter();
  const [data, setData] = useState<ReferralOverview | null>(null);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      referralsApi
        .me()
        .then((res) => {
          if (live) setData(res);
        })
        .catch(() => {
          if (live) setData(null);
        });
      return () => {
        live = false;
      };
    }, [])
  );

  const stats = data?.stats;
  return (
    <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: c.ink }]}>Total earned</Text>
        <Text style={[styles.value, { color: c.ink }]}>{formatInr(stats?.earnedAmount ?? 0)}</Text>
      </View>
      <Text style={[styles.note, { color: c.ink }]}>
        {stats && stats.invited > 0
          ? `${stats.invited} friend${stats.invited === 1 ? '' : 's'} joined, ${stats.qualified} subscribed${
              stats.pendingAmount > 0 ? ` · ${formatInr(stats.pendingAmount)} to be paid` : ''
            }.`
          : `Invite friends and earn ${formatInr(data?.rewardAmount ?? 200)} for each paid subscription.`}
      </Text>
      <Pressable
        onPress={() => router.push('/account-screens/referrals' as never)}
        accessibilityRole="button"
      >
        <Text style={[styles.link, { color: c.violet }]}>Refer & earn →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, gap: 8, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontFamily: font.semiBold, fontSize: 14 },
  value: { fontFamily: font.display, fontSize: 24 },
  note: { fontFamily: font.body, fontSize: 12.5, opacity: 0.6, lineHeight: 18 },
  link: { fontFamily: font.bold, fontSize: 13 },
});
