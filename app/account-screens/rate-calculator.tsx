import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ScrollScreen, KollabScreenHeader, KollabTextField } from '@/components/ui';
import { useKollab, font, choiceChipColors } from '@/theme/kollab-tokens';
import { formatInr } from '@/lib/currency';

type PlatformKey = 'instagram' | 'youtube' | 'twitter';

// --- Multipliers and base rates (copied from web) ---
const platformBaseRates = {
  instagram: [
    {
      tier: 'Nano',
      followers_min: 1000,
      followers_max: 10000,
      rate_usd_min: 8,
      rate_usd_max: 12,
      rate_inr_min: 680,
      rate_inr_max: 1020,
    },
    {
      tier: 'Micro',
      followers_min: 10001,
      followers_max: 50000,
      rate_usd_min: 6,
      rate_usd_max: 10,
      rate_inr_min: 510,
      rate_inr_max: 850,
    },
    {
      tier: 'Mid-tier',
      followers_min: 50001,
      followers_max: 500000,
      rate_usd_min: 4,
      rate_usd_max: 8,
      rate_inr_min: 340,
      rate_inr_max: 680,
    },
    {
      tier: 'Macro',
      followers_min: 500001,
      followers_max: 1000000,
      rate_usd_min: 3,
      rate_usd_max: 6,
      rate_inr_min: 255,
      rate_inr_max: 510,
    },
    {
      tier: 'Mega',
      followers_min: 1000001,
      followers_max: Infinity,
      rate_usd_min: 2,
      rate_usd_max: 4,
      rate_inr_min: 170,
      rate_inr_max: 340,
    },
  ],
  youtube: [
    {
      tier: 'Nano',
      followers_min: 1000,
      followers_max: 10000,
      rate_usd_min: 15,
      rate_usd_max: 25,
      rate_inr_min: 1275,
      rate_inr_max: 2125,
    },
    {
      tier: 'Micro',
      followers_min: 10001,
      followers_max: 100000,
      rate_usd_min: 12,
      rate_usd_max: 20,
      rate_inr_min: 1020,
      rate_inr_max: 1700,
    },
    {
      tier: 'Mid-tier',
      followers_min: 100001,
      followers_max: 500000,
      rate_usd_min: 10,
      rate_usd_max: 16,
      rate_inr_min: 850,
      rate_inr_max: 1360,
    },
    {
      tier: 'Macro',
      followers_min: 500001,
      followers_max: 1000000,
      rate_usd_min: 8,
      rate_usd_max: 12,
      rate_inr_min: 680,
      rate_inr_max: 1020,
    },
    {
      tier: 'Mega',
      followers_min: 1000001,
      followers_max: Infinity,
      rate_usd_min: 6,
      rate_usd_max: 10,
      rate_inr_min: 510,
      rate_inr_max: 850,
    },
  ],
  twitter: [
    {
      tier: 'Nano',
      followers_min: 1000,
      followers_max: 10000,
      rate_usd_min: 2,
      rate_usd_max: 4,
      rate_inr_min: 170,
      rate_inr_max: 340,
    },
    {
      tier: 'Micro',
      followers_min: 10001,
      followers_max: 50000,
      rate_usd_min: 1.5,
      rate_usd_max: 3,
      rate_inr_min: 128,
      rate_inr_max: 255,
    },
    {
      tier: 'Mid-tier',
      followers_min: 50001,
      followers_max: 500000,
      rate_usd_min: 1,
      rate_usd_max: 2.5,
      rate_inr_min: 85,
      rate_inr_max: 213,
    },
    {
      tier: 'Macro',
      followers_min: 500001,
      followers_max: 1000000,
      rate_usd_min: 0.8,
      rate_usd_max: 1.5,
      rate_inr_min: 68,
      rate_inr_max: 128,
    },
    {
      tier: 'Mega',
      followers_min: 1000001,
      followers_max: Infinity,
      rate_usd_min: 0.5,
      rate_usd_max: 1,
      rate_inr_min: 43,
      rate_inr_max: 85,
    },
  ],
};
const engagementRateMultipliers = {
  instagram: { excellent: 1.5, good: 1.3, average: 1.0, below_average: 0.8 },
  youtube: { excellent: 1.3, good: 1.2, average: 1.0, below_average: 0.7 },
  twitter: { excellent: 1.2, good: 1.1, average: 1.0, below_average: 0.6 },
};
const contentTypeMultipliers: Record<string, number> = {
  'Standard Post': 1.0,
  'Video/Reel': 1.35,
  Story: 0.8,
  Carousel: 1.1,
  Tweet: 1.0,
};
const usageRightsMultipliers: Record<string, number> = {
  Standard: 1.0,
  '3 months ads': 1.3,
  '6 months ads': 1.6,
  '1 year ads': 2.0,
};
const nicheMultipliers: Record<string, number> = {
  'Finance/Investment': 1.8,
  'Technology/SaaS': 1.6,
  'Healthcare/Medical': 1.5,
  'B2B/Professional': 1.4,
  'Luxury Goods': 1.4,
  'Beauty/Skincare': 1.3,
  Fashion: 1.2,
  Gaming: 1.2,
  Automotive: 1.15,
  Lifestyle: 1.0,
  'Food/Cooking': 1.05,
  Fitness: 1.05,
  Travel: 1.0,
  'DIY/Crafts': 0.9,
  'General Entertainment': 0.95,
  'Pets/Animals': 0.95,
};
function getPlatformRate(platform: PlatformKey, followers: number, currency: 'usd' | 'inr') {
  const rates = platformBaseRates[platform];
  const tier = rates.find((r) => followers >= r.followers_min && followers <= r.followers_max);
  if (!tier) {
    if (followers > 0 && followers < 1000) {
      const nanoTier = rates.find((r) => r.tier === 'Nano');
      if (!nanoTier) return { min: 0, max: 0 };
      if (currency === 'usd') {
        return { min: nanoTier.rate_usd_min, max: nanoTier.rate_usd_max };
      } else {
        return { min: nanoTier.rate_inr_min, max: nanoTier.rate_inr_max };
      }
    }
    return { min: 0, max: 0 };
  }
  if (currency === 'usd') {
    return { min: tier.rate_usd_min, max: tier.rate_usd_max };
  }
  return { min: tier.rate_inr_min, max: tier.rate_inr_max };
}
function getEngagementMultiplier(platform: PlatformKey, engagementRate: number) {
  const multipliers = engagementRateMultipliers[platform];
  if (engagementRate > 5) return multipliers.excellent;
  if (engagementRate >= 3) return multipliers.good;
  if (engagementRate >= 1) return multipliers.average;
  return multipliers.below_average;
}
function calculateRate({
  platform,
  followers,
  engagementRate,
  nicheMultiplier,
  contentTypeMultiplier,
  usageRightsMultiplier,
}: {
  platform: PlatformKey;
  followers: number;
  engagementRate: number;
  nicheMultiplier: number;
  contentTypeMultiplier: number;
  usageRightsMultiplier: number;
}) {
  if (followers <= 0) return { usd_min: 0, usd_max: 0, inr_min: 0, inr_max: 0 };
  const ratePer1kUSD = getPlatformRate(platform, followers, 'usd');
  const baseRateUSDMin = (followers / 1000) * ratePer1kUSD.min;
  const baseRateUSDMax = (followers / 1000) * ratePer1kUSD.max;
  const ratePer1kINR = getPlatformRate(platform, followers, 'inr');
  const baseRateINRMin = (followers / 1000) * ratePer1kINR.min;
  const baseRateINRMax = (followers / 1000) * ratePer1kINR.max;
  const engagementMultiplier = getEngagementMultiplier(platform, engagementRate);
  const mul =
    nicheMultiplier * engagementMultiplier * contentTypeMultiplier * usageRightsMultiplier;
  return {
    usd_min: baseRateUSDMin * mul,
    usd_max: baseRateUSDMax * mul,
    inr_min: baseRateINRMin * mul,
    inr_max: baseRateINRMax * mul,
  };
}

const HTML_NICHES: { label: string; key: string }[] = [
  { label: 'Fashion', key: 'Fashion' },
  { label: 'Fitness', key: 'Fitness' },
  { label: 'Tech', key: 'Technology/SaaS' },
  { label: 'Food', key: 'Food/Cooking' },
  { label: 'Lifestyle', key: 'Lifestyle' },
];

const HTML_TYPES: { label: string; platform: PlatformKey; contentType: string }[] = [
  { label: 'Instagram Reel', platform: 'instagram', contentType: 'Video/Reel' },
  { label: 'Instagram Post', platform: 'instagram', contentType: 'Standard Post' },
  { label: 'Instagram Story', platform: 'instagram', contentType: 'Story' },
  { label: 'YouTube Integration', platform: 'youtube', contentType: 'Video/Reel' },
];

const HTML_RIGHTS: { label: string; key: string }[] = [
  { label: 'Organic only', key: 'Standard' },
  { label: 'Paid ads 30d', key: '3 months ads' },
  { label: 'Whitelisting', key: '1 year ads' },
];

function ChipRow({
  options,
  value,
  onChange,
  kollab,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  kollab: ReturnType<typeof useKollab>;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const on = value === opt;
        const chip = choiceChipColors(kollab, on);
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.chip,
              {
                backgroundColor: chip.backgroundColor,
                borderColor: chip.borderColor,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: chip.color }]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function InfluencerRateCalculator() {
  const kollab = useKollab();
  const [followers, setFollowers] = useState('50000');
  const [engagementRate, setEngagementRate] = useState('3.5');
  const [nicheLabel, setNicheLabel] = useState('Lifestyle');
  const [typeLabel, setTypeLabel] = useState('Instagram Reel');
  const [rightsLabel, setRightsLabel] = useState('Organic only');

  const niche = HTML_NICHES.find((n) => n.label === nicheLabel)?.key ?? 'Lifestyle';
  const typeSpec = HTML_TYPES.find((t) => t.label === typeLabel) ?? HTML_TYPES[0];
  const rights = HTML_RIGHTS.find((r) => r.label === rightsLabel)?.key ?? 'Standard';

  const result = calculateRate({
    platform: typeSpec.platform,
    followers: Number(followers) || 0,
    engagementRate: Number(engagementRate) || 0,
    nicheMultiplier: nicheMultipliers[niche] ?? 1,
    contentTypeMultiplier: contentTypeMultipliers[typeSpec.contentType] ?? 1,
    usageRightsMultiplier: usageRightsMultipliers[rights] ?? 1,
  });

  const mid = Math.round((result.inr_min + result.inr_max) / 2);
  const followersK = Math.round((Number(followers) || 0) / 1000);

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KollabScreenHeader
        title="Rate calculator"
        subtitle="Estimate what a collaboration is worth"
      />

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Followers / subscribers</Text>
      <KollabTextField
        placeholder="e.g., 50000"
        keyboardType="numeric"
        value={followers}
        onChangeText={(v) => setFollowers(v.replace(/[^0-9]/g, ''))}
        style={styles.field}
      />

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Engagement rate</Text>
      <KollabTextField
        placeholder="e.g., 3.5"
        keyboardType="decimal-pad"
        value={engagementRate}
        onChangeText={(v) => setEngagementRate(v.replace(/[^0-9.]/g, ''))}
        style={styles.field}
      />

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Niche / industry</Text>
      <ChipRow
        options={HTML_NICHES.map((n) => n.label)}
        value={nicheLabel}
        onChange={setNicheLabel}
        kollab={kollab}
      />

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Content type</Text>
      <ChipRow
        options={HTML_TYPES.map((t) => t.label)}
        value={typeLabel}
        onChange={setTypeLabel}
        kollab={kollab}
      />

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>Usage rights</Text>
      <ChipRow
        options={HTML_RIGHTS.map((r) => r.label)}
        value={rightsLabel}
        onChange={setRightsLabel}
        kollab={kollab}
      />

      <View style={[styles.result, { backgroundColor: kollab.color.panel }]}>
        <Text style={[styles.resultLabel, { color: kollab.color.panelInk }]}>
          Your estimated rate
        </Text>
        <Text style={[styles.resultValue, { color: kollab.color.chartreuse }]}>
          {formatInr(mid)}
        </Text>
        <Text style={[styles.resultBasis, { color: kollab.color.panelInk }]}>
          {followersK}K followers · {engagementRate}% engagement · {typeLabel.toLowerCase()} ·{' '}
          {rightsLabel.toLowerCase()}
        </Text>
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontFamily: font.semiBold,
    fontSize: 12.5,
    opacity: 0.62,
    marginBottom: 7,
  },
  field: { marginBottom: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 15,
  },
  chipText: { fontFamily: font.semiBold, fontSize: 12.5 },
  result: { borderRadius: 24, padding: 22, marginTop: 6 },
  resultLabel: { fontFamily: font.body, fontSize: 12, opacity: 0.6 },
  resultValue: { fontFamily: font.display, fontSize: 42, marginVertical: 2 },
  resultBasis: { fontFamily: font.body, fontSize: 12, opacity: 0.6 },
});
