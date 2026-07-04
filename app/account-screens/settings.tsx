import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth-store';
import { useRouter } from 'expo-router';
import ProfileSection from '../../components/influencer/ProfileSection';
import PasswordSection from '../../components/influencer/PasswordSection';
import NotificationSection from '../../components/influencer/NotificationSection';
import { kindeConfigured } from '../../lib/auth-config';
import { Screen, PremiumSegmentedControl, type PremiumSegment } from '@/components/ui';
import { palette, spacing } from '@/theme';

const ALL_TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'password', label: 'Password' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'logout', label: 'Logout' },
] as const;

export default function InfluencerSettingsScreen() {
  const tabs = useMemo(
    () => (kindeConfigured ? ALL_TABS.filter((t) => t.key !== 'password') : [...ALL_TABS]),
    []
  );
  const segments: PremiumSegment[] = useMemo(
    () =>
      tabs.map((tab) =>
        tab.key === 'logout'
          ? {
              key: tab.key,
              label: tab.label,
              tone: 'danger' as const,
              icon: <Ionicons name="log-out-outline" size={14} color={palette.error} />,
            }
          : { key: tab.key, label: tab.label }
      ),
    [tabs]
  );
  const [activeTab, setActiveTab] = useState('profile');
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleTabPress = (tabKey: string) => {
    if (tabKey === 'logout') {
      handleLogout();
    } else {
      setActiveTab(tabKey);
    }
  };

  return (
    <Screen dotBackground safeAreaEdges={['top', 'left', 'right']} padH={0}>
      <View style={styles.tabBarWrap}>
        <PremiumSegmentedControl segments={segments} value={activeTab} onChange={handleTabPress} />
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing.lg }} showsVerticalScrollIndicator={false}>
        {activeTab === 'profile' && <ProfileSection />}
        {activeTab === 'password' && <PasswordSection />}
        {activeTab === 'notifications' && <NotificationSection />}
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
