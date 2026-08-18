import { useCallback, useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { KollabTabBar } from '@/components/KollabTabBar';
import { useKollab } from '@/theme/kollab-tokens';

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
  const kollab = useKollab();
  const renderTabBar = useCallback((props: BottomTabBarProps) => <KollabTabBar {...props} />, []);

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarShowLabel: true,
      sceneContainerStyle: { backgroundColor: kollab.color.screen },
    }),
    [kollab.color.screen]
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
          title: 'Collabs',
          tabBarLabel: 'Collabs',
          tabBarIcon: CampaignsTabIcon,
          headerShown: false,
        }}
      />
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
          headerShown: false,
          tabBarIcon: SettingsTabIcon,
        }}
      />
    </Tabs>
  );
}
