import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth-store';
import { api } from '../lib/api';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Example: Replace with your actual endpoint for influencer stats
        const data = await api.get('/api/influencers/stats');
        setStats(data);
      } catch (e: any) {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isAuthenticated]);

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
          onPress: () => {
            console.log('Navigating to login from main dashboard...');
            router.replace('/login');
          },
        },
      ]
    );
  };

  if (!isAuthenticated) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {user?.firstName || user?.email || 'Influencer'}!</Text>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => {
            console.log('Navigating to login from main dashboard...');
            router.replace('/login');
          }}
        >
          <Ionicons name="log-out-outline" size={16} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#00b894" style={{ marginTop: 32 }} />
      ) : stats ? (
        <View style={styles.statsBox}>
          <Text style={styles.statsTitle}>Your Stats</Text>
          <Text>Potential: {stats.potential || 'N/A'}%</Text>
          <Text>Viewers: {stats.viewers || 'N/A'}</Text>
          <Text>Engagement: {stats.engagement || 'N/A'}</Text>
          <Text>Monthly Goal: {stats.monthlyGoal?.points || 'N/A'} Points</Text>
          {/* Add more stats as needed */}
        </View>
      ) : (
        <Text style={styles.error}>Failed to load stats.</Text>
      )}
      {/* Add social media connect status, actions, etc. here */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', flex: 1 },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  statsBox: { backgroundColor: '#f1f2f6', borderRadius: 12, padding: 16, marginTop: 24 },
  statsTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  error: { color: 'red', marginTop: 16, textAlign: 'center' },
}); 