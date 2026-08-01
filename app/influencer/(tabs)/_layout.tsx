import { useCallback, useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PremiumTabBar } from '@/components/PremiumTabBar';
import { useAppShell } from '@/theme/useAppShell';

// Pure functions of (color, size) — never need to close over screen state, so
// hoisted to module scope instead of being recreated on every render.
function HomeTabIcon({ color, size }: { color: string; size: number }) {
  return <Ionicons name="home-outline" size={size} color={color} />;
}
function CampaignsTabIcon({ color, size }: { color: string; size: number }) {
  return <Ionicons name="layers-outline" size={size} color={color} />;
}
function StatsTabIcon({ color, size }: { color: string; size: number }) {
  return <Ionicons name="bar-chart-outline" size={size} color={color} />;
}
function SettingsTabIcon({ color, size }: { color: string; size: number }) {
  return <Ionicons name="settings-outline" size={size} color={color} />;
}

export default function InfluencerTabsLayout() {
  const shell = useAppShell();

  const renderTabBar = useCallback((props: BottomTabBarProps) => <PremiumTabBar {...props} />, []);

  const screenOptions = useMemo(
    () => ({
      headerShown: true,
      headerTitleStyle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 18,
        color: shell.textPrimary,
      },
      headerStyle: {
        backgroundColor: shell.canvas,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: shell.cta,
      tabBarShowLabel: true,
    }),
    [shell.textPrimary, shell.canvas, shell.cta]
  );

  return (
    <Tabs tabBar={renderTabBar} screenOptions={screenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          headerShown: false,
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tabs.Screen
        name="campaigns"
        options={{
          title: 'Campaigns',
          tabBarLabel: 'Campaigns',
          tabBarIcon: CampaignsTabIcon,
          headerShown: false,
        }}
      />
      <Tabs.Screen name="inbox" options={{ href: null }} />
      <Tabs.Screen
        name="my-stats"
        options={{
          title: 'My Stats',
          tabBarLabel: 'Stats',
          headerShown: false,
          tabBarIcon: StatsTabIcon,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: SettingsTabIcon,
        }}
      />
      <Tabs.Screen name="ugc-jobs" options={{ href: null }} />
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen name="ratings" options={{ href: null }} />
    </Tabs>
  );
}
