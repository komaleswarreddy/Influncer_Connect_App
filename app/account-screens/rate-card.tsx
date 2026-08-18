import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ScrollScreen,
  KollabScreenHeader,
  KollabTextField,
  KollabButton,
  showKollabToast,
  showKollabConfirm,
} from '@/components/ui';
import { rateCardsApi } from '@/lib/rate-cards-api';
import { api } from '@/lib/api';
import {
  isInfluencerProfileReadyForSuggestions,
  PROFILE_INCOMPLETE_HINT,
  type InfluencerProfileApi,
} from '@/lib/influencer-profile-ready';
import { useKollab, font } from '@/theme/kollab-tokens';
import { formatInr } from '@/lib/currency';

const FIELDS = [
  ['instagramReel', 'Instagram Reel'],
  ['instagramPost', 'Instagram Post'],
  ['instagramStory', 'Instagram Story'],
  ['youtubeIntegration', 'YouTube Integration'],
  ['youtubeDedicated', 'YouTube Dedicated'],
  ['tiktokVideo', 'TikTok Video'],
  ['ugcVideo', 'UGC Video'],
  ['ugcPhoto', 'UGC Photo'],
  ['appearanceFee', 'Appearance fee'],
  ['consultationFee', 'Consultation fee'],
] as const;

type SuggestedEntry = { amount: number; explanation: string };

export default function RateCardScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const [rates, setRates] = useState<Record<string, string>>({});
  const [isPublic, setIsPublic] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [suggested, setSuggested] = useState<Record<string, SuggestedEntry>>({});

  const loadProfile = useCallback(async () => {
    try {
      const profile = (await api.get('/api/influencers/profile')) as InfluencerProfileApi;
      setProfileReady(isInfluencerProfileReadyForSuggestions(profile));
    } catch {
      setProfileReady(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await loadProfile();
      const res = (await rateCardsApi.getMy()) as { rateCard?: Record<string, unknown> };
      const card = res.rateCard;
      if (!card) return;
      const next: Record<string, string> = {};
      for (const [key] of FIELDS) next[key] = String(card[key] ?? 0);
      setRates(next);
      setIsPublic(Boolean(card.isPublic));
      setIsOpen(Boolean(card.isOpenForBookings));
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Failed to load price card');
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    void load();
  }, [load]);

  const promptCompleteProfile = () => {
    void showKollabConfirm({
      title: 'Profile required',
      message: PROFILE_INCOMPLETE_HINT,
      confirmLabel: 'Open profile settings',
    }).then((ok) => {
      if (ok) router.push('/account-screens/settings' as never);
    });
  };

  const save = async () => {
    try {
      const body: Record<string, unknown> = { isPublic, isOpenForBookings: isOpen };
      for (const [key] of FIELDS) body[key] = Number(rates[key] ?? 0);
      await rateCardsApi.updateMy(body);
      showKollabToast('Saved');
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const loadSuggested = async () => {
    if (!profileReady) {
      promptCompleteProfile();
      return;
    }
    setSuggesting(true);
    try {
      const res = (await rateCardsApi.getSuggested()) as {
        suggested?: Record<string, SuggestedEntry>;
      };
      setSuggested(res.suggested ?? {});
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load suggestions';
      if (msg.includes('profile') || msg.includes('Profile')) promptCompleteProfile();
      else showKollabToast(msg);
    } finally {
      setSuggesting(false);
    }
  };

  const applySuggested = () => {
    const next = { ...rates };
    for (const [key] of FIELDS) {
      const s = suggested[key];
      if (s?.amount != null) next[key] = String(s.amount);
    }
    setRates(next);
    showKollabToast('Suggested amounts filled in');
  };

  if (loading) {
    return (
      <ScrollScreen>
        <KollabScreenHeader
          title="Price card"
          subtitle="Set public prices so brands can request direct bookings"
        />
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 24 }} />
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KollabScreenHeader
        title="Price card"
        subtitle="Set public prices so brands can request direct bookings"
      />

      {!profileReady ? (
        <View style={[styles.banner, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
          <Text style={[styles.bannerTitle, { color: kollab.color.ink }]}>
            Profile settings required
          </Text>
          <Text style={[styles.bannerText, { color: kollab.color.ink }]}>
            {PROFILE_INCOMPLETE_HINT}
          </Text>
          <KollabButton
            label="Go to profile settings"
            variant="soft"
            onPress={() => router.push('/account-screens/settings')}
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        <KollabButton
          label={suggesting ? '…' : 'Get AI suggestions'}
          variant="soft"
          compact
          disabled={suggesting || !profileReady}
          onPress={() => void loadSuggested()}
          style={styles.actionBtn}
        />
        <KollabButton
          label="Apply suggested"
          variant="hairline"
          compact
          disabled={Object.keys(suggested).length === 0}
          onPress={applySuggested}
          style={styles.actionBtn}
        />
      </View>

      <View style={styles.rows}>
        {FIELDS.map(([key, label]) => (
          <View
            key={key}
            style={[styles.rowWell, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
          >
            <Text style={[styles.rowLabel, { color: kollab.color.ink }]}>{label}</Text>
            <KollabTextField
              surface="well"
              keyboardType="numeric"
              value={rates[key] ?? ''}
              onChangeText={(v) => setRates({ ...rates, [key]: v })}
              placeholder="0"
              style={styles.amount}
            />
            {suggested[key] ? (
              <Text style={[styles.hint, { color: kollab.color.ink }]}>
                {formatInr(suggested[key].amount)}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.toggles}>
        <PressToggle
          label="Public price card"
          value={isPublic}
          onChange={setIsPublic}
          kollab={kollab}
        />
        <PressToggle
          label="Open for direct bookings"
          value={isOpen}
          onChange={setIsOpen}
          kollab={kollab}
        />
      </View>

      <KollabButton label="Save" variant="ink" onPress={() => void save()} />
    </ScrollScreen>
  );
}

function PressToggle({
  label,
  value,
  onChange,
  kollab,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  kollab: ReturnType<typeof useKollab>;
}) {
  return (
    <View style={[styles.toggleWell, { backgroundColor: kollab.color.card }, kollab.shadow.card]}>
      <Text style={[styles.toggleLabel, { color: kollab.color.ink }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: kollab.color.outline, true: kollab.color.violet }}
        thumbColor={kollab.color.card}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: 22, padding: 16, marginBottom: 16, gap: 8 },
  bannerTitle: { fontFamily: font.semiBold, fontSize: 14.5 },
  bannerText: { fontFamily: font.body, fontSize: 13, opacity: 0.55, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 9, marginBottom: 16 },
  actionBtn: { flex: 1 },
  rows: { gap: 9, marginBottom: 16 },
  rowWell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingVertical: 6,
    paddingLeft: 16,
    paddingRight: 6,
  },
  rowLabel: { flex: 1, fontFamily: font.semiBold, fontSize: 13.5 },
  amount: { width: 112, textAlign: 'right', fontFamily: font.bold, paddingVertical: 12 },
  hint: {
    fontFamily: font.body,
    fontSize: 11,
    opacity: 0.55,
    position: 'absolute',
    bottom: -14,
    right: 16,
  },
  toggles: { gap: 9, marginBottom: 18 },
  toggleWell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 17,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toggleLabel: { flex: 1, fontFamily: font.semiBold, fontSize: 13.5 },
});
