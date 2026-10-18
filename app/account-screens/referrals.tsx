import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import {
  KollabButton,
  KollabEmptyCard,
  KollabScreenHeader,
  KollabSectionLabel,
  KollabStatTile,
  KollabStatusChip,
  KollabTextField,
  ScrollScreen,
  showKollabToast,
} from '@/components/ui';
import { referralsApi, type ReferralOverview, type ReferralStatus } from '@/lib/referrals-api';
import { looksLikeReferralCode, normalizeReferralInput } from '@/lib/pending-referral';
import { formatInr } from '@/lib/currency';
import { formatIsoDate } from '@/lib/invoice-math';
import { font, useKollab } from '@/theme/kollab-tokens';

const STATUS_UI: Record<ReferralStatus, { label: string; tone: 'neutral' | 'money' | 'live' }> = {
  signed_up: { label: 'Joined', tone: 'neutral' },
  qualified: { label: 'Reward earned', tone: 'money' },
  paid: { label: 'Paid out', tone: 'live' },
};

export default function ReferralsScreen() {
  const kollab = useKollab();
  const c = kollab.color;
  const [data, setData] = useState<ReferralOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await referralsApi.me());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your referral details');
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

  const copyCode = async () => {
    if (!data) return;
    try {
      await Clipboard.setStringAsync(data.code);
      showKollabToast('Referral code copied');
    } catch {
      showKollabToast('Could not copy the code');
    }
  };

  const shareInvite = async () => {
    if (!data) return;
    try {
      await Share.share({ message: data.shareMessage });
    } catch {
      showKollabToast('Could not open the share sheet');
    }
  };

  const applyCode = async () => {
    const code = normalizeReferralInput(codeInput);
    if (!looksLikeReferralCode(code)) {
      showKollabToast('Enter the 6-character referral code');
      return;
    }
    setApplying(true);
    try {
      await referralsApi.apply(code);
      setCodeInput('');
      showKollabToast('Referral code applied');
      await load();
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not apply that code');
    } finally {
      setApplying(false);
    }
  };

  const reward = data ? formatInr(data.rewardAmount) : formatInr(200);

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
      <KollabScreenHeader title="Referral Program" subtitle="Invite friends and earn rewards" />

      <Text style={[styles.hero, { color: c.ink }]}>START EARNING WITH REFERRALS</Text>
      <Text style={[styles.heroSub, { color: c.ink }]}>
        Invite your friends and earn {reward} for each successful paid subscription.
      </Text>

      {loading ? (
        <ActivityIndicator color={c.ink} style={{ marginTop: 24 }} />
      ) : error || !data ? (
        <KollabEmptyCard
          title="Couldn’t load your referral code"
          subtitle={error ?? 'Please try again.'}
          ctaLabel="Try again"
          onPress={() => {
            setLoading(true);
            void load();
          }}
          style={{ marginHorizontal: 0 }}
        />
      ) : (
        <>
          <View style={[styles.codeBox, { borderColor: c.ink, backgroundColor: c.card }]}>
            <Text style={[styles.codeLabel, { color: c.ink }]}>YOUR REFERRAL CODE</Text>
            <View style={styles.codeRow}>
              <Text
                style={[styles.code, { color: c.violetDeep }]}
                selectable
                accessibilityLabel={`Your referral code is ${data.code.split('').join(' ')}`}
              >
                {data.code}
              </Text>
              <Pressable
                onPress={() => void copyCode()}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Copy referral code"
              >
                <Ionicons name="copy-outline" size={26} color={c.ink} />
              </Pressable>
              <Pressable
                onPress={() => void shareInvite()}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Share referral code"
              >
                <Ionicons name="share-social-outline" size={26} color={c.ink} />
              </Pressable>
            </View>
          </View>

          <KollabSectionLabel label="how it works" />
          <View style={styles.steps}>
            <Step
              n="01"
              title="SHARE CODE"
              body="Send your unique referral code to your friends and family."
            />
            <Step
              n="02"
              title="FRIEND SIGNS UP & PURCHASES"
              body="Your friend completes signup, adds your code and takes a paid subscription."
            />
            <Step
              n="03"
              title={`YOU EARN ${reward}`}
              body="The reward is added to your earnings once their paid subscription is confirmed."
              active
            />
          </View>

          <KollabButton
            label="INVITE NOW"
            variant="primary"
            onPress={() => void shareInvite()}
            style={styles.invite}
          />

          <KollabSectionLabel label="your referrals" />
          <View style={styles.tiles}>
            <KollabStatTile
              label="Earned"
              value={formatInr(data.stats.earnedAmount)}
              delta={
                data.stats.pendingAmount > 0
                  ? `${formatInr(data.stats.pendingAmount)} to be paid`
                  : data.stats.paidAmount > 0
                    ? 'all paid out'
                    : 'none yet'
              }
              fill="dark"
              style={styles.tile}
            />
            <KollabStatTile
              label="Friends"
              value={String(data.stats.invited)}
              delta={`${data.stats.qualified} subscribed`}
              fill="tint"
              style={styles.tile}
            />
          </View>

          {data.referrals.length === 0 ? (
            <Text style={[styles.empty, { color: c.ink }]}>
              No one has joined with your code yet. Share it to get started.
            </Text>
          ) : (
            <View style={styles.list}>
              {data.referrals.map((f) => {
                const ui = STATUS_UI[f.status] ?? STATUS_UI.signed_up;
                return (
                  <View
                    key={f.id}
                    style={[styles.friend, { backgroundColor: c.card }, kollab.shadow.card]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.friendName, { color: c.ink }]} numberOfLines={1}>
                        {f.name}
                      </Text>
                      <Text style={[styles.friendMeta, { color: c.ink }]}>
                        Joined {formatIsoDate(f.createdAt.slice(0, 10))}
                      </Text>
                    </View>
                    <View style={styles.friendRight}>
                      <KollabStatusChip tone={ui.tone} label={ui.label} />
                      <Text
                        style={[
                          styles.friendAmt,
                          { color: f.status === 'signed_up' ? c.ink : c.teal },
                        ]}
                      >
                        {f.status === 'signed_up'
                          ? `${formatInr(f.rewardAmount)} pending`
                          : `+${formatInr(f.rewardAmount)}`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {data.canApplyCode ? (
            <View style={[styles.applyCard, { backgroundColor: c.card }, kollab.shadow.card]}>
              <Text style={[styles.applyTitle, { color: c.ink }]}>Have a friend’s code?</Text>
              <Text style={[styles.applySub, { color: c.ink }]}>
                You can add one within {data.applyWindowDays} days of joining. It can only be used
                once.
              </Text>
              <KollabTextField
                surface="well"
                value={codeInput}
                onChangeText={(v) => setCodeInput(v.toUpperCase())}
                placeholder="Referral code"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
              />
              <KollabButton
                label="Apply code"
                variant="ink"
                loading={applying}
                onPress={() => void applyCode()}
              />
            </View>
          ) : data.referredBy ? (
            <Text style={[styles.joined, { color: c.ink }]}>
              You joined with code {data.referredBy.code}.
            </Text>
          ) : null}
        </>
      )}
    </ScrollScreen>
  );
}

function Step({
  n,
  title,
  body,
  active,
}: {
  n: string;
  title: string;
  body: string;
  active?: boolean;
}) {
  const kollab = useKollab();
  const c = kollab.color;
  return (
    <View style={styles.step}>
      <Text style={[styles.stepNum, { color: active ? c.violetDeep : c.outline }]}>{n}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepTitle, { color: c.ink }]}>{title}</Text>
        <Text style={[styles.stepBody, { color: c.ink }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    fontFamily: font.display,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    marginTop: 6,
  },
  heroSub: {
    fontFamily: font.body,
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    opacity: 0.65,
    marginTop: 8,
    marginBottom: 20,
  },
  codeBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  codeLabel: { fontFamily: font.bold, fontSize: 12, letterSpacing: 2.4, opacity: 0.7 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22 },
  code: { fontFamily: font.display, fontSize: 44, letterSpacing: 4 },
  steps: { gap: 18, marginBottom: 20 },
  step: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  stepNum: { fontFamily: font.display, fontSize: 40, width: 56 },
  stepTitle: { fontFamily: font.bold, fontSize: 14, letterSpacing: 0.6 },
  stepBody: { fontFamily: font.body, fontSize: 14, lineHeight: 20, opacity: 0.65, marginTop: 3 },
  invite: { marginBottom: 22 },
  tiles: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  tile: { flex: 1 },
  empty: {
    fontFamily: font.body,
    fontSize: 13.5,
    opacity: 0.55,
    textAlign: 'center',
    marginVertical: 10,
  },
  list: { gap: 10 },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, padding: 14 },
  friendName: { fontFamily: font.bold, fontSize: 15 },
  friendMeta: { fontFamily: font.body, fontSize: 12.5, opacity: 0.55, marginTop: 2 },
  friendRight: { alignItems: 'flex-end', gap: 6 },
  friendAmt: { fontFamily: font.semiBold, fontSize: 13 },
  applyCard: { borderRadius: 22, padding: 16, gap: 10, marginTop: 18 },
  applyTitle: { fontFamily: font.bold, fontSize: 16 },
  applySub: { fontFamily: font.body, fontSize: 13, opacity: 0.6, lineHeight: 18 },
  joined: {
    fontFamily: font.medium,
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 16,
  },
});
