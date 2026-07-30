import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ProfileSection from '../../components/influencer/ProfileSection';
import PasswordSection from '../../components/influencer/PasswordSection';
import { cognitoConfigured } from '../../lib/auth-config';
import { Screen, PremiumSegmentedControl, type PremiumSegment } from '@/components/ui';
import { spacing } from '@/theme';

const ALL_TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'password', label: 'Password' },
] as const;

export default function InfluencerSettingsScreen() {
  const tabs = useMemo(
    () => (cognitoConfigured ? ALL_TABS.filter((t) => t.key !== 'password') : [...ALL_TABS]),
    []
  );
  const segments: PremiumSegment[] = useMemo(
    () => tabs.map((tab) => ({ key: tab.key, label: tab.label })),
    [tabs]
  );
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <Screen dotBackground safeAreaEdges={['top', 'left', 'right']} padH={0}>
      {segments.length > 1 ? (
        <View style={styles.tabBarWrap}>
          <PremiumSegmentedControl segments={segments} value={activeTab} onChange={setActiveTab} />
        </View>
      ) : null}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'profile' && <ProfileSection />}
        {activeTab === 'password' && <PasswordSection />}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
});
