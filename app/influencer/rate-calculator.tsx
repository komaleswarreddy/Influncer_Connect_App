import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Platform as RNPlatform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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
const contentTypeMultipliers = {
  'Standard Post': 1.0,
  'Video/Reel': 1.35,
  'Story': 0.8,
  'Carousel': 1.1,
  'Tweet': 1.0,
};
const usageRightsMultipliers = {
  'Standard': 1.0,
  '3 months ads': 1.3,
  '6 months ads': 1.6,
  '1 year ads': 2.0,
};
const nicheMultipliers = {
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

function getPlatformRate(platform, followers, currency) {
  const rates = platformBaseRates[platform];
  const tier = rates.find(r => followers >= r.followers_min && followers <= r.followers_max);
  if (!tier) {
    if (followers > 0 && followers < 1000) {
      const nanoTier = rates.find(r => r.tier === 'Nano');
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
function getEngagementMultiplier(platform, engagementRate) {
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
  const [platform, setPlatform] = useState('instagram');
  const [followers, setFollowers] = useState(50000);
  const [engagementRate, setEngagementRate] = useState(3.5);
  const [niche, setNiche] = useState('Lifestyle');
  const [contentType, setContentType] = useState('Standard Post');
  const [usageRights, setUsageRights] = useState('3 months ads');
  const [result, setResult] = useState({ usd_min: 0, usd_max: 0, inr_min: 0, inr_max: 0 });

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

  // Update content type if platform changes
  useEffect(() => {
    if (!platformConfig[platform].contentTypes.includes(contentType)) {
      setContentType(platformConfig[platform].contentTypes[0]);
    }
  }, [platform, contentType]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <Text style={styles.header}>Influencer Rate Calculator</Text>
        {/* Platform selection */}
        <View style={styles.platformTabs}>
          {Object.keys(platformConfig).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.tab, platform === p && styles.tabActive]}
              onPress={() => setPlatform(p)}
            >
              {platformConfig[p].icon}
              <Text style={[styles.tabText, platform === p && styles.tabTextActive]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Followers / Subscribers</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={followers.toString()}
            onChangeText={v => setFollowers(Number(v.replace(/[^0-9]/g, '')))}
            placeholder="e.g., 50000"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Engagement Rate (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={engagementRate.toString()}
            onChangeText={v => setEngagementRate(Number(v.replace(/[^0-9.]/g, '')))}
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
        {/* Result */}
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Your Estimated Rate</Text>
          <View style={styles.resultRow}>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>USD</Text>
              <Text style={styles.resultValue}>${Math.round(result.usd_min).toLocaleString()} - ${Math.round(result.usd_max).toLocaleString()}</Text>
            </View>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>INR</Text>
              <Text style={styles.resultValue}>₹{Math.round(result.inr_min).toLocaleString()} - ₹{Math.round(result.inr_max).toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
    color: '#0f172a',
  },
  platformTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#bae6fd',
  },
  tabText: {
    marginLeft: 6,
    fontWeight: '600',
    color: '#334155',
  },
  tabTextActive: {
    color: '#0284c7',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#0f172a',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: RNPlatform.OS === 'ios' ? 120 : 44,
    width: '100%',
  },
  resultCard: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#0f172a',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 18,
  },
  resultBox: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  resultLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0284c7',
  },
}); 