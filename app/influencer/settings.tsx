import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileSection from '../../components/influencer/ProfileSection';
import PasswordSection from '../../components/influencer/PasswordSection';
import NotificationSection from '../../components/influencer/NotificationSection';

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'password', label: 'Password' },
  { key: 'notifications', label: 'Notifications' },
];

export default function InfluencerSettingsScreen() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Segmented Control */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>{tab.label}</Text>
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
  tabLabel: {
    color: '#14b8a6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeTabLabel: {
    color: '#fff',
  },
}); 