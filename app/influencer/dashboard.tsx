import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth-store';
import { useInfluencerStore } from '@/store/influencer-store';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';

export default function InfluencerDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const {
    isLoading,
    error,
    isConnected,
    isYtConnected,
    isTwitterConnected,
    connectInstagram,
    fetchInstagramAnalytics,
    connectYouTube,
    fetchYouTubeAnalytics,
    connectTwitter,
    fetchTwitterAnalytics,
    clearError,
  } = useInfluencerStore();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // State for username inputs
  const [instagramUsername, setInstagramUsername] = useState('');
  const [youtubeUsername, setYoutubeUsername] = useState('');
  const [twitterUsername, setTwitterUsername] = useState('');
  const [showInstagramInput, setShowInstagramInput] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [showTwitterInput, setShowTwitterInput] = useState(false);

  // --- Static stats (from web dashboard) ---
  const stats = {
    potential: 58,
    accountNumber: '3253',
    viewers: '65,031',
    engagement: '25,214',
    monthlyGoal: {
      progress: 53,
      points: 350,
    },
    socialMedia: {
      instagram: { points: 1230 },
      twitter: { points: 1230 },
      youtube: { points: 1230 },
    },
    actions: [
      { icon: '📝', title: '3 Posts Added', color: '#DBEAFE' },
      { icon: '⭐', title: 'Premium Plan Bought', color: '#E9D5FF' },
      { icon: '📹', title: '2 Videos Added', color: '#BBF7D0' },
      { icon: '✅', title: 'Sponsorship Signed', color: '#99F6E4' },
    ],
  };

  useEffect(() => {
    fetchInstagramAnalytics();
    fetchYouTubeAnalytics();
    fetchTwitterAnalytics();
  }, [fetchInstagramAnalytics, fetchYouTubeAnalytics, fetchTwitterAnalytics]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

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
            console.log('Navigating to login...');
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleConnectInstagram = async () => {
    if (!instagramUsername.trim()) {
      Alert.alert('Error', 'Please enter your Instagram username');
      return;
    }
    try {
      await connectInstagram(instagramUsername.trim());
      Alert.alert('Success', 'Instagram connected successfully!');
      setShowInstagramInput(false);
      setInstagramUsername('');
    } catch (error) {
      Alert.alert('Error', 'Failed to connect Instagram');
    }
  };

  const handleConnectYouTube = async () => {
    if (!youtubeUsername.trim()) {
      Alert.alert('Error', 'Please enter your YouTube username');
      return;
    }
    try {
      await connectYouTube(youtubeUsername.trim());
      Alert.alert('Success', 'YouTube connected successfully!');
      setShowYoutubeInput(false);
      setYoutubeUsername('');
    } catch (error) {
      Alert.alert('Error', 'Failed to connect YouTube');
    }
  };

  const handleConnectTwitter = async () => {
    if (!twitterUsername.trim()) {
      Alert.alert('Error', 'Please enter your Twitter username');
      return;
    }
    try {
      await connectTwitter(twitterUsername.trim());
      Alert.alert('Success', 'Twitter connected successfully!');
      setShowTwitterInput(false);
      setTwitterUsername('');
    } catch (error) {
      Alert.alert('Error', 'Failed to connect Twitter');
    }
  };

  const isMediaKitReady = isConnected || isYtConnected || isTwitterConnected;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#f5f5f5',
    },
    content: {
      padding: 16,
    },
    header: {
      marginBottom: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: isDark ? '#ccc' : '#666',
    },
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
    mediaKitCard: {
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    mediaKitHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    mediaKitIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    mediaKitTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      flex: 1,
    },
    mediaKitDescription: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
      marginBottom: 12,
    },
    connectButton: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },
    connectButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    connectedStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    connectedDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#34C759',
      marginRight: 8,
    },
    connectedText: {
      color: '#34C759',
      fontWeight: '600',
    },
    inputContainer: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f8f8',
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
    },
    inputHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    closeButton: {
      padding: 4,
    },
    input: {
      backgroundColor: isDark ? '#333' : '#fff',
      borderRadius: 6,
      padding: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    inputButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 10,
      borderRadius: 6,
      alignItems: 'center',
    },
    inputButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.headerSubtitle, { marginTop: 12 }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Your Stats</Text>
            <Text style={styles.headerSubtitle}>
              Welcome back, {user?.firstName}!
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={() => {
              console.log('Navigating to login...');
              router.replace('/login');
            }}
          >
            <Ionicons name="log-out-outline" size={16} color="#fff" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* --- Account Details Section --- */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          {/* Potential Progress */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 90, height: 90, marginBottom: 8, alignItems: 'center', justifyContent: 'center' }}>
              {/* Static circle */}
              <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 8, borderColor: '#10B981', borderRightColor: '#E5E7EB', borderBottomColor: '#E5E7EB', borderLeftColor: '#E5E7EB', borderTopColor: '#10B981', backgroundColor: isDark ? '#222' : '#fff', position: 'absolute', top: 0, left: 0 }} />
              {/* Centered percentage text using absolute fill */}
              <View style={{ position: 'absolute', top: 0, left: 0, width: 90, height: 90, alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: isDark ? '#fff' : '#222' }}>{stats.potential}%</Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>POTENTIAL</Text>
              </View>
            </View>
          </View>
          {/* Account Card */}
          <View style={{ flex: 1, marginLeft: 12, backgroundColor: '#F472B6', borderRadius: 12, padding: 12, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>Account</Text>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>**** {stats.accountNumber}</Text>
          </View>
        </View>
        {/* Stats Cards */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, marginRight: 6, alignItems: 'center', elevation: 2 }}>
            <Text style={{ color: '#888', fontSize: 13 }}>Viewers</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 4 }}>{stats.viewers} views</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, marginLeft: 6, alignItems: 'center', elevation: 2 }}>
            <Text style={{ color: '#888', fontSize: 13 }}>Engagement</Text>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 4 }}>{stats.engagement} focused</Text>
          </View>
        </View>

        {/* --- Actions Performed Section --- */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Actions Performed</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch' }}>
            {stats.actions.map((action, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: action.color,
                  borderRadius: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 4,
                  alignItems: 'center',
                  flex: 1,
                  marginLeft: idx === 0 ? 0 : 6,
                  marginRight: idx === stats.actions.length - 1 ? 0 : 0,
                  minWidth: 0,
                }}
              >
                <Text style={{ fontSize: 18 }}>{action.icon}</Text>
                <Text style={{ fontSize: 11, marginTop: 4, fontWeight: '500', textAlign: 'center' }}>{action.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- Feature Cards Section --- */}
        <View style={{ flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {/* Mobile App Sync */}
          <View style={{ backgroundColor: '#FEF9C3', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>Mobile App Sync</Text>
            <Text style={{ fontSize: 12, color: '#B45309', marginBottom: 8, textAlign: 'center' }}>Keep your stats in sync with the mobile app.</Text>
            <Text style={{ fontSize: 32 }}>📱</Text>
          </View>
          {/* Influence Ranking */}
          <View style={{ backgroundColor: '#CCFBF1', borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>Influence Ranking</Text>
            <Text style={{ fontSize: 12, color: '#0F766E', marginBottom: 8, textAlign: 'center' }}>Your current rank among influencers.</Text>
            <View style={{ backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 4 }}>
              <Text style={{ color: '#0D9488', fontWeight: 'bold', fontSize: 18 }}>#11</Text>
            </View>
          </View>
        </View>

        {/* --- User Profile Card Section --- */}
        <View style={{ backgroundColor: isDark ? '#222' : '#fff', borderRadius: 14, padding: 18, marginBottom: 18, alignItems: 'center', elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#5EEAD4', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 28, color: '#134E4A', fontWeight: 'bold' }}>{user?.firstName?.[0] || 'D'}</Text>
            </View>
            <View>
              <Text style={{ fontWeight: 'bold', fontSize: 17 }}>{user?.firstName || 'David'} {user?.lastName || 'Jones'}</Text>
              <Text style={{ color: '#888', fontSize: 13 }}>Influencer</Text>
            </View>
          </View>
          {/* Monthly Goal */}
          <View style={{ width: '100%', marginBottom: 10 }}>
            <Text style={{ fontWeight: '500', fontSize: 14, marginBottom: 4 }}>Monthly Goal</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#A7F3D0', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Text style={{ color: '#0D9488', fontWeight: 'bold', fontSize: 15 }}>{stats.monthlyGoal.progress}%</Text>
              </View>
              <Text style={{ color: '#888', fontSize: 13 }}>{stats.monthlyGoal.points} Points</Text>
            </View>
          </View>
          {/* Social Media Points */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: '#E11D48', fontWeight: 'bold', fontSize: 15 }}>{stats.socialMedia.instagram.points}</Text>
              <Text style={{ color: '#E11D48', fontSize: 12 }}>Instagram</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: '#2563EB', fontWeight: 'bold', fontSize: 15 }}>{stats.socialMedia.twitter.points}</Text>
              <Text style={{ color: '#2563EB', fontSize: 12 }}>Twitter</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 15 }}>{stats.socialMedia.youtube.points}</Text>
              <Text style={{ color: '#DC2626', fontSize: 12 }}>YouTube</Text>
            </View>
          </View>
        </View>

        {isMediaKitReady && (
          <View style={styles.mediaKitCard}>
            <View style={styles.mediaKitHeader}>
              <View style={[styles.mediaKitIcon, { backgroundColor: '#34C759' }]}>
                <Ionicons name="document-text" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mediaKitTitle}>Your Media Kit is Ready!</Text>
                <Text style={styles.mediaKitDescription}>
                  View your combined social media analytics in one place.
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.connectButton}>
              <Text style={styles.connectButtonText}>View Media Kit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instagram Connection */}
        <View style={styles.mediaKitCard}>
          <View style={styles.mediaKitHeader}>
            <View style={[styles.mediaKitIcon, { backgroundColor: '#E4405F' }]}>
              <Ionicons name="logo-instagram" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mediaKitTitle}>Instagram Analytics</Text>
              <Text style={styles.mediaKitDescription}>
                {isConnected
                  ? 'Instagram account is connected.'
                  : 'Connect your Instagram to generate your media kit.'}
              </Text>
            </View>
            {isConnected ? (
              <View style={styles.connectedStatus}>
                <View style={styles.connectedDot} />
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => setShowInstagramInput(true)}
                disabled={isLoading}
              >
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            )}
          </View>

          {showInstagramInput && (
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Enter your Instagram username:</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowInstagramInput(false);
                    setInstagramUsername('');
                  }}
                >
                  <Ionicons name="close" size={20} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                value={instagramUsername}
                onChangeText={setInstagramUsername}
                placeholder="@username"
                placeholderTextColor={isDark ? '#666' : '#999'}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.inputButton}
                onPress={handleConnectInstagram}
                disabled={isLoading || !instagramUsername.trim()}
              >
                <Text style={styles.inputButtonText}>
                  {isLoading ? 'Connecting...' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* YouTube Connection */}
        <View style={styles.mediaKitCard}>
          <View style={styles.mediaKitHeader}>
            <View style={[styles.mediaKitIcon, { backgroundColor: '#FF0000' }]}>
              <Ionicons name="logo-youtube" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mediaKitTitle}>YouTube Analytics</Text>
              <Text style={styles.mediaKitDescription}>
                {isYtConnected
                  ? 'YouTube account is connected.'
                  : 'Connect your YouTube account to enhance your media kit.'}
              </Text>
            </View>
            {isYtConnected ? (
              <View style={styles.connectedStatus}>
                <View style={styles.connectedDot} />
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => setShowYoutubeInput(true)}
                disabled={isLoading}
              >
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            )}
          </View>

          {showYoutubeInput && (
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Enter your YouTube username:</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowYoutubeInput(false);
                    setYoutubeUsername('');
                  }}
                >
                  <Ionicons name="close" size={20} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                value={youtubeUsername}
                onChangeText={setYoutubeUsername}
                placeholder="username"
                placeholderTextColor={isDark ? '#666' : '#999'}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.inputButton}
                onPress={handleConnectYouTube}
                disabled={isLoading || !youtubeUsername.trim()}
              >
                <Text style={styles.inputButtonText}>
                  {isLoading ? 'Connecting...' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Twitter Connection */}
        <View style={styles.mediaKitCard}>
          <View style={styles.mediaKitHeader}>
            <View style={[styles.mediaKitIcon, { backgroundColor: '#1DA1F2' }]}>
              <Ionicons name="logo-twitter" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mediaKitTitle}>Twitter Analytics</Text>
              <Text style={styles.mediaKitDescription}>
                {isTwitterConnected
                  ? 'Twitter account is connected.'
                  : 'Connect your Twitter to enhance your media kit.'}
              </Text>
            </View>
            {isTwitterConnected ? (
              <View style={styles.connectedStatus}>
                <View style={styles.connectedDot} />
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={() => setShowTwitterInput(true)}
                disabled={isLoading}
              >
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            )}
          </View>

          {showTwitterInput && (
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Enter your Twitter username:</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowTwitterInput(false);
                    setTwitterUsername('');
                  }}
                >
                  <Ionicons name="close" size={20} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                value={twitterUsername}
                onChangeText={setTwitterUsername}
                placeholder="@username"
                placeholderTextColor={isDark ? '#666' : '#999'}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.inputButton}
                onPress={handleConnectTwitter}
                disabled={isLoading || !twitterUsername.trim()}
              >
                <Text style={styles.inputButtonText}>
                  {isLoading ? 'Connecting...' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 