import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScrollScreen, SectionHeader, PremiumCard } from '@/components/ui';
import { rateCardsApi } from '@/lib/rate-cards-api';
import { api } from '@/lib/api';
import {
  isInfluencerProfileReadyForSuggestions,
  PROFILE_INCOMPLETE_HINT,
  type InfluencerProfileApi,
} from '@/lib/influencer-profile-ready';
import { appShell, spacing } from '@/theme';

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

function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export default function RateCardScreen() {
  const router = useRouter();
  const [rates, setRates] = useState<Record<string, string>>({});
  const [isPublic, setIsPublic] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [suggested, setSuggested] = useState<Record<string, SuggestedEntry>>({});
  const [suggestionMeta, setSuggestionMeta] = useState<{
    niche?: string;
    country?: string;
    source?: string;
  } | null>(null);

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
      const res = (await rateCardsApi.getMy()) as {
        rateCard?: Record<string, unknown>;
      };
      const card = res.rateCard;
      if (!card) return;
      const next: Record<string, string> = {};
      for (const [key] of FIELDS) next[key] = String(card[key] ?? 0);
      setRates(next);
      setIsPublic(Boolean(card.isPublic));
      setIsOpen(Boolean(card.isOpenForBookings));
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load price card');
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  useEffect(() => {
    void load();
  }, [load]);

  const promptCompleteProfile = () => {
    Alert.alert('Profile required', PROFILE_INCOMPLETE_HINT, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open profile settings',
        onPress: () => router.push('/account-screens/settings'),
      },
    ]);
  };

  const save = async () => {
    try {
      const body: Record<string, unknown> = { isPublic, isOpenForBookings: isOpen };
      for (const [key] of FIELDS) body[key] = Number(rates[key] ?? 0);
      await rateCardsApi.updateMy(body);
      Alert.alert('Saved', 'Price card updated.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Save failed');
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
        niche?: string;
        country?: string;
        profile?: { niche?: string; country?: string };
        source?: string;
      };
      setSuggested(res.suggested ?? {});
      setSuggestionMeta({
        niche: res.profile?.niche ?? res.niche,
        country: res.profile?.country ?? res.country,
        source: res.source,
      });
      const viaAi = res.source === 'llm';
      Alert.alert(
        'Suggestions ready',
        viaAi
          ? 'AI suggestions based on your saved profile (niche, country, bio).'
          : 'Suggestions loaded from your profile (rules fallback).'
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load suggestions';
      if (msg.includes('profile') || msg.includes('Profile')) {
        promptCompleteProfile();
      } else {
        Alert.alert('Error', msg);
      }
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
    Alert.alert('Applied', 'Suggested amounts filled in. Tap Save to persist.');
  };

  if (loading) {
    return (
      <ScrollScreen>
        <SectionHeader title="Price card" subtitle="Set your public booking prices (INR)" />
        <View style={styles.centered}>
          <ActivityIndicator color={appShell.cta} />
        </View>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <SectionHeader
        title="Price card"
        subtitle="Set public prices so brands can request direct bookings"
      />

      {!profileReady ? (
        <PremiumCard style={styles.banner}>
          <Text style={styles.bannerTitle}>Profile settings required</Text>
          <Text style={styles.bannerText}>{PROFILE_INCOMPLETE_HINT}</Text>
          <TouchableOpacity
            style={styles.bannerBtn}
            onPress={() => router.push('/account-screens/settings')}
          >
            <Text style={styles.bannerBtnText}>Go to profile settings</Text>
          </TouchableOpacity>
        </PremiumCard>
      ) : null}

      <PremiumCard style={styles.actionsCard}>
        <TouchableOpacity
          style={[styles.suggestBtn, (suggesting || !profileReady) && styles.suggestBtnDisabled]}
          onPress={() => void loadSuggested()}
          disabled={suggesting || !profileReady}
        >
          {suggesting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.suggestBtnText}>Get AI suggestions</Text>
          )}
        </TouchableOpacity>
        {Object.keys(suggested).length > 0 ? (
          <>
            {suggestionMeta ? (
              <Text style={styles.meta}>
                {suggestionMeta.niche && suggestionMeta.country
                  ? `${suggestionMeta.niche} · ${suggestionMeta.country}`
                  : ''}
                {suggestionMeta.source === 'llm'
                  ? ' · AI'
                  : suggestionMeta.source
                    ? ' · rules'
                    : ''}
              </Text>
            ) : null}
            <TouchableOpacity style={styles.applyBtn} onPress={applySuggested}>
              <Text style={styles.applyBtnText}>Apply suggested prices</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </PremiumCard>

      <PremiumCard>
        {FIELDS.map(([key, label]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={rates[key] ?? ''}
              onChangeText={(v) => setRates({ ...rates, [key]: v })}
              placeholder="0"
            />
            {suggested[key] ? (
              <Text style={styles.hint}>
                Suggested: {formatInr(suggested[key].amount)}
                {suggested[key].explanation ? ` — ${suggested[key].explanation}` : ''}
              </Text>
            ) : null}
          </View>
        ))}
        <View style={styles.switchRow}>
          <Text style={styles.label}>Public price card</Text>
          <Switch value={isPublic} onValueChange={setIsPublic} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Open for direct bookings</Text>
          <Switch value={isOpen} onValueChange={setIsOpen} />
        </View>
        <TouchableOpacity style={styles.btn} onPress={() => void save()}>
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
      </PremiumCard>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  centered: { paddingVertical: spacing.xl, alignItems: 'center' },
  banner: { marginBottom: spacing.md },
  bannerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: appShell.textPrimary,
    marginBottom: 6,
  },
  bannerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: appShell.textSecondary,
    lineHeight: 18,
  },
  bannerBtn: {
    marginTop: spacing.md,
    backgroundColor: appShell.cta,
    padding: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  bannerBtnText: { color: '#fff', fontFamily: 'Inter_600SemiBold' },
  actionsCard: { marginBottom: spacing.md },
  suggestBtn: {
    backgroundColor: appShell.cta,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  suggestBtnDisabled: { opacity: 0.5 },
  suggestBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
  applyBtn: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: appShell.cta,
    alignItems: 'center',
  },
  applyBtnText: { color: appShell.cta, fontFamily: 'Inter_600SemiBold' },
  meta: {
    marginTop: spacing.sm,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: appShell.textSecondary,
  },
  row: { marginBottom: spacing.md },
  label: { fontFamily: 'Inter_600SemiBold', color: appShell.textPrimary, marginBottom: 4 },
  hint: {
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: appShell.textSecondary,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: appShell.cardBorder,
    borderRadius: 10,
    padding: spacing.sm,
    fontFamily: 'Inter_400Regular',
    color: appShell.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  btn: {
    backgroundColor: appShell.cta,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontFamily: 'Inter_700Bold' },
});
