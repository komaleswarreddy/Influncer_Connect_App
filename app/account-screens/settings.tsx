import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth-store';
import { useRouter } from 'expo-router';
import ProfileSection from '../../components/influencer/ProfileSection';
import PasswordSection from '../../components/influencer/PasswordSection';
import NotificationSection from '../../components/influencer/NotificationSection';

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'password', label: 'Password' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'logout', label: 'Logout' },
];

export default function InfluencerSettingsScreen() {
  const [activeTab, setActiveTab] = useState('profile');
  const { logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleTabPress = (tabKey: string) => {
    if (tabKey === 'logout') {
      handleLogout();
    } else {
      setActiveTab(tabKey);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Segmented Control */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab, 
              activeTab === tab.key && styles.activeTab,
              tab.key === 'logout' && styles.logoutTab
            ]}
            onPress={() => handleTabPress(tab.key)}
          >
            <Text style={[
              styles.tabLabel, 
              activeTab === tab.key && styles.activeTabLabel,
              tab.key === 'logout' && styles.logoutTabLabel
            ]}>
              {tab.key === 'logout' && <Ionicons name="log-out-outline" size={16} style={{ marginRight: 4 }} />}
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 0 }}>
        {activeTab === 'profile' && <ProfileSection />}
        {activeTab === 'password' && <PasswordSection />}
        {activeTab === 'notifications' && <NotificationSection />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#e0f2f1',
    borderRadius: 12,
    margin: 16,
    marginBottom: 0,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#14b8a6',
  },
  logoutTab: {
    backgroundColor: '#fef2f2',
  },
  tabLabel: {
    color: '#14b8a6',
    fontWeight: 'bold',
    fontSize: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTabLabel: {
    color: '#fff',
  },
  logoutTabLabel: {
    color: '#dc2626',
  },
}); 