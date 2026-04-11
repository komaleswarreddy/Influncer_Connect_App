import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform as RNPlatform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  PremiumTextInput,
  ScrollScreen,
  SectionHeader,
  PremiumSegmentedControl,
  type PremiumSegment,
} from '@/components/ui';
import { appShell, premiumNavy, radius, shadow, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';

type PlatformKey = 'instagram' | 'youtube' | 'twitter';

// --- Multipliers and base rates (copied from web) ---
const platformBaseRates = {
  instagram: [
    { tier: 'Nano', followers_min: 1000, followers_max: 10000, rate_usd_min: 8, rate_usd_max: 12, rate_inr_min: 680, rate_inr_max: 1020 },
    { tier: 'Micro', followers_min: 10001, followers_max: 50000, rate_usd_min: 6, rate_usd_max: 10, rate_inr_min: 510, rate_inr_max: 850 },
    { tier: 'Mid-tier', followers_min: 50001, followers_max: 500000, rate_usd_min: 4, rate_usd_max: 8, rate_inr_min: 340, rate_inr_max: 680 },
    { tier: 'Macro', followers_min: 500001, followers_max: 1000000, rate_usd_min: 3, rate_usd_max: 6, rate_inr_min: 255, rate_inr_max: 510 },
    { tier: 'Mega', followers_min: 1000001, followers_max: Infinity, rate_usd_min: 2, rate_usd_max: 4, rate_inr_min: 170, rate_inr_max: 340 },
  ],
  youtube: [
    { tier: 'Nano', followers_min: 1000, followers_max: 10000, rate_usd_min: 15, rate_usd_max: 25, rate_inr_min: 1275, rate_inr_max: 2125 },
    { tier: 'Micro', followers_min: 10001, followers_max: 100000, rate_usd_min: 12, rate_usd_max: 20, rate_inr_min: 1020, rate_inr_max: 1700 },
    { tier: 'Mid-tier', followers_min: 100001, followers_max: 500000, rate_usd_min: 10, rate_usd_max: 16, rate_inr_min: 850, rate_inr_max: 1360 },
    { tier: 'Macro', followers_min: 500001, followers_max: 1000000, rate_usd_min: 8, rate_usd_max: 12, rate_inr_min: 680, rate_inr_max: 1020 },
    { tier: 'Mega', followers_min: 1000001, followers_max: Infinity, rate_usd_min: 6, rate_usd_max: 10, rate_inr_min: 510, rate_inr_max: 850 },
  ],
  twitter: [
    { tier: 'Nano', followers_min: 1000, followers_max: 10000, rate_usd_min: 2, rate_usd_max: 4, rate_inr_min: 170, rate_inr_max: 340 },
    { tier: 'Micro', followers_min: 10001, followers_max: 50000, rate_usd_min: 1.5, rate_usd_max: 3, rate_inr_min: 128, rate_inr_max: 255 },
    { tier: 'Mid-tier', followers_min: 50001, followers_max: 500000, rate_usd_min: 1, rate_usd_max: 2.5, rate_inr_min: 85, rate_inr_max: 213 },
    { tier: 'Macro', followers_min: 500001, followers_max: 1000000, rate_usd_min: 0.8, rate_usd_max: 1.5, rate_inr_min: 68, rate_inr_max: 128 },
    { tier: 'Mega', followers_min: 1000001, followers_max: Infinity, rate_usd_min: 0.5, rate_usd_max: 1, rate_inr_min: 43, rate_inr_max: 85 },
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
  'Story': 0.8,
  'Carousel': 1.1,
  'Tweet': 1.0,
};
const usageRightsMultipliers: Record<string, number> = {
  'Standard': 1.0,
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
  'Fashion': 1.2,
  'Gaming': 1.2,
  'Automotive': 1.15,
  'Lifestyle': 1.0,
  'Food/Cooking': 1.05,
  'Fitness': 1.05,
  'Travel': 1.0,
  'DIY/Crafts': 0.9,
  'General Entertainment': 0.95,
  'Pets/Animals': 0.95,
};
const platformConfig = {
  instagram: {
    icon: <FontAwesome name="instagram" size={20} color="#E1306C" />,
    contentTypes: ['Standard Post', 'Video/Reel', 'Story', 'Carousel'],
  },
  youtube: {
    icon: <FontAwesome name="youtube-play" size={20} color="#FF0000" />,
    contentTypes: ['Video/Reel'],
  },
  twitter: {
    icon: <FontAwesome name="twitter" size={20} color="#1DA1F2" />,
    contentTypes: ['Tweet'],
  },
};

const PLATFORM_KEYS: PlatformKey[] = ['instagram', 'youtube', 'twitter'];

function getPlatformRate(platform: PlatformKey, followers: number, currency: 'usd' | 'inr') {
  const rates = platformBaseRates[platform];
  const tier = rates.find(r => followers >= r.followers_min && followers <= r.followers_max);
  if (!tier) {
    if (followers > 0 && followers < 1000) {
      const nanoTier = rates.find(r => r.tier === 'Nano');
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
  } else {
    return { min: tier.rate_inr_min, max: tier.rate_inr_max };
  }
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
  const finalRateUSDMin = baseRateUSDMin * nicheMultiplier * engagementMultiplier * contentTypeMultiplier * usageRightsMultiplier;
  const finalRateUSDMax = baseRateUSDMax * nicheMultiplier * engagementMultiplier * contentTypeMultiplier * usageRightsMultiplier;
  const finalRateINRMin = baseRateINRMin * nicheMultiplier * engagementMultiplier * contentTypeMultiplier * usageRightsMultiplier;
  const finalRateINRMax = baseRateINRMax * nicheMultiplier * engagementMultiplier * contentTypeMultiplier * usageRightsMultiplier;
  return {
    usd_min: finalRateUSDMin,
    usd_max: finalRateUSDMax,
    inr_min: finalRateINRMin,
    inr_max: finalRateINRMax,
  };
}

export default function InfluencerRateCalculator() {
  const [platform, setPlatform] = useState<PlatformKey>('instagram');
  const [followers, setFollowers] = useState(50000);
  const [engagementRate, setEngagementRate] = useState(3.5);
  const [niche, setNiche] = useState('Lifestyle');
  const [contentType, setContentType] = useState('Standard Post');
  const [usageRights, setUsageRights] = useState('3 months ads');
  const [result, setResult] = useState({ usd_min: 0, usd_max: 0, inr_min: 0, inr_max: 0 });

  const platformSegments: PremiumSegment[] = useMemo(
    () =>
      PLATFORM_KEYS.map((p) => ({
        key: p,
        label: p === 'youtube' ? 'YouTube' : p.charAt(0).toUpperCase() + p.slice(1),
        icon: platformConfig[p].icon,
      })),
    []
  );

  useEffect(() => {
    const calculatedRates = calculateRate({
      platform,
      followers: Number(followers),
      engagementRate: Number(engagementRate),
      nicheMultiplier: nicheMultipliers[niche] ?? 1,
      contentTypeMultiplier: contentTypeMultipliers[contentType] ?? 1,
      usageRightsMultiplier: usageRightsMultipliers[usageRights] ?? 1,
    });
    setResult(calculatedRates);
  }, [platform, followers, engagementRate, niche, contentType, usageRights]);

  useEffect(() => {
    if (!platformConfig[platform].contentTypes.includes(contentType)) {
      setContentType(platformConfig[platform].contentTypes[0]);
    }
  }, [platform, contentType]);

  return (
    <ScrollScreen safeAreaEdges={['left', 'right', 'bottom']} padH={spacing.md} scrollProps={{ showsVerticalScrollIndicator: false }}>
      <SectionHeader
        overline="Tools"
        title="Rate calculator"
        subtitle="Estimate collaboration rates from reach, engagement, and usage."
        comfortable
      />
      <PremiumSegmentedControl
        segments={platformSegments}
        value={platform}
        onChange={(key) => setPlatform(key as PlatformKey)}
        style={styles.platformSegments}
      />
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Followers / Subscribers</Text>
        <PremiumTextInput
          style={styles.input}
          keyboardType="numeric"
          value={followers.toString()}
          onChangeText={(v) => setFollowers(Number(v.replace(/[^0-9]/g, '')))}
          placeholder="e.g., 50000"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Engagement Rate (%)</Text>
        <PremiumTextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={engagementRate.toString()}
          onChangeText={(v) => setEngagementRate(Number(v.replace(/[^0-9.]/g, '')))}
          placeholder="e.g., 3.5"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Niche / Industry</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={niche}
            onValueChange={setNiche}
            style={styles.picker}
          >
            {Object.keys(nicheMultipliers).map((n) => (
              <Picker.Item key={n} label={n} value={n} />
            ))}
          </Picker>
        </View>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Content Type</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={contentType}
            onValueChange={setContentType}
            style={styles.picker}
          >
            {platformConfig[platform].contentTypes.map((c) => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Usage Rights</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={usageRights}
            onValueChange={setUsageRights}
            style={styles.picker}
          >
            {Object.keys(usageRightsMultipliers).map((u) => (
              <Picker.Item key={u} label={u} value={u} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.resultShell}>
        <LinearGradient
          colors={[...premiumNavy.base.colors]}
          locations={[...premiumNavy.base.locations]}
          start={premiumNavy.base.start}
          end={premiumNavy.base.end}
          style={styles.resultHeaderBand}
        >
          <LinearGradient
            colors={[...premiumNavy.sheen.colors]}
            locations={[...premiumNavy.sheen.locations]}
            start={premiumNavy.sheen.start}
            end={premiumNavy.sheen.end}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Text style={styles.resultTitleOnNavy}>Your estimated rate</Text>
        </LinearGradient>
        <View style={styles.resultBody}>
          <View style={styles.resultRow}>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>USD</Text>
              <Text style={styles.resultValue}>
                ${Math.round(result.usd_min).toLocaleString()} – ${Math.round(result.usd_max).toLocaleString()}
              </Text>
            </View>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>INR</Text>
              <Text style={styles.resultValue}>
                ₹{Math.round(result.inr_min).toLocaleString()} – ₹{Math.round(result.inr_max).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  platformSegments: {
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontFamily: fonts.semiBold,
    marginBottom: 6,
    color: appShell.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: appShell.borderSubtle,
    padding: spacing.sm,
    fontSize: 14,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: appShell.borderSubtle,
    borderRadius: radius.md,
    backgroundColor: appShell.card,
    overflow: 'hidden',
    minHeight: 50,
  },
  picker: {
    height: RNPlatform.OS === 'ios' ? 120 : 50,
    width: '100%',
    color: appShell.textPrimary,
    fontSize: 14,
    backgroundColor: appShell.card,
  },
  resultShell: {
    marginTop: spacing.md,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: appShell.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
    ...shadow.card,
  },
  resultHeaderBand: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  resultTitleOnNavy: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: '#F8FAFC',
    letterSpacing: -0.3,
    zIndex: 1,
  },
  resultBody: {
    padding: spacing.md,
    backgroundColor: appShell.card,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
  },
  resultBox: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: appShell.iceBlue,
    borderRadius: radius.md,
  },
  resultLabel: {
    fontSize: 12,
    color: appShell.textSecondary,
    fontFamily: fonts.semiBold,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultValue: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: appShell.cta,
    textAlign: 'center',
  },
});
