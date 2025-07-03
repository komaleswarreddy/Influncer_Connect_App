import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth-store';

const ACCOUNT_LINKS = [
  { key: 'media-kit', label: 'Media Kit', icon: 'document-text-outline', path: '/account-screens/media-kit' },
  { key: 'rate-calculator', label: 'Rate Calculator', icon: 'calculator-outline', path: '/account-screens/rate-calculator' },
  { key: 'support-hub', label: 'Support', icon: 'help-circle-outline', path: '/account-screens/support-hub' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', path: '/account-screens/settings' },
  { key: 'logout', label: 'Logout', icon: 'log-out-outline', action: 'logout' },
];

export default function AccountScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleItemPress = (link: any) => {
    if (link.action === 'logout') {
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
            onPress: () => {
              logout();
              router.replace('/login');
            },
          },
        ]
      );
    } else if (link.path) {
      router.navigate(link.path as any);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingVertical: 24 }}>
      <Text style={styles.header}>Account</Text>
      <View style={styles.list}>
        {ACCOUNT_LINKS.map(link => (
          <TouchableOpacity
            key={link.key}
            style={styles.item}
            onPress={() => handleItemPress(link)}
          >
            <Ionicons 
              name={link.icon as any} 
              size={24} 
              color={link.action === 'logout' ? '#EF4444' : '#14b8a6'} 
              style={{ marginRight: 16 }} 
            />
            <Text style={[styles.label, link.action === 'logout' && styles.logoutLabel]}>
              {link.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#222',
    alignSelf: 'center',
  },
  list: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    fontSize: 18,
    color: '#222',
  },
  logoutLabel: {
    color: '#EF4444',
  },
}); 