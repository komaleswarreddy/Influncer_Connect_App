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
import { LinearGradient } from 'expo-linear-gradient';

export default function InfluencerDashboard() {
  const { user } = useAuthStore();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header Section */}
        <View style={{
          borderRadius: 24,
          marginBottom: 24,
          paddingVertical: 18,
          paddingHorizontal: 20,
          backgroundColor: '#fff',
          shadowColor: '#14b8a6',
          shadowOpacity: 0.07,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#14b8a6',
            textAlign: 'left',
            marginBottom: 4,
          }}>Your Stats</Text>
          <TouchableOpacity style={{
            alignSelf: 'flex-end',
            backgroundColor: '#f0fdfa',
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingVertical: 8,
          }}>
            <Text style={{ color: '#14b8a6', fontWeight: 'bold' }}>More Details</Text>
          </TouchableOpacity>
        </View>

        {/* Media Kit Card */}
        {isMediaKitReady && (
          <View style={{
            backgroundColor: '#f0fdfa',
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            shadowColor: '#14b8a6',
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 1,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{ backgroundColor: '#bbf7d0', padding: 12, borderRadius: 24, marginRight: 12 }}>
                <Ionicons name="document-text-outline" size={28} color="#14b8a6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#14b8a6' }}>Your Media Kit is Ready!</Text>
                <Text style={{ color: '#64748b', fontSize: 14 }}>View your combined social media analytics in one place.</Text>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: '#2dd4bf', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}
                onPress={() => router.push('/account-screens/media-kit')}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>View Media Kit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats Section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          {/* Potential Progress */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 2, borderColor: '#bae6fd' }}>
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#14b8a6' }}>{stats.potential}%</Text>
            </View>
            <Text style={{ color: '#64748b', fontSize: 12 }}>POTENTIAL</Text>
          </View>
          {/* Viewers */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="eye-outline" size={32} color="#0ea5e9" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0ea5e9' }}>{stats.viewers}</Text>
            </View>
            <Text style={{ color: '#64748b', fontSize: 12 }}>Viewers</Text>
          </View>
          {/* Engagement */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="chatbubble-ellipses-outline" size={32} color="#ec4899" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#ec4899' }}>{stats.engagement}</Text>
            </View>
            <Text style={{ color: '#64748b', fontSize: 12 }}>Engagement</Text>
          </View>
        </View>

        {/* Monthly Goal Progress */}
        <View style={{ backgroundColor: '#fefce8', borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center', shadowColor: '#facc15', shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#ca8a04', marginBottom: 4 }}>Monthly Goal</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#fde68a', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#ca8a04' }}>{stats.monthlyGoal.progress}%</Text>
            </View>
            <Text style={{ color: '#ca8a04', fontWeight: 'bold', fontSize: 16 }}>{stats.monthlyGoal.points} Points</Text>
          </View>
          <View style={{ height: 8, width: '100%', backgroundColor: '#fde68a', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ height: 8, width: `${stats.monthlyGoal.progress}%`, backgroundColor: '#ca8a04', borderRadius: 4 }} />
          </View>
        </View>

        {/* Social Media Points */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center', marginRight: 4 }}>
            <Ionicons name="logo-instagram" size={28} color="#db2777" />
            <Text style={{ fontWeight: 'bold', color: '#db2777', fontSize: 16 }}>{stats.socialMedia.instagram.points}</Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>Instagram</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center', marginHorizontal: 4 }}>
            <Ionicons name="logo-twitter" size={28} color="#2563eb" />
            <Text style={{ fontWeight: 'bold', color: '#2563eb', fontSize: 16 }}>{stats.socialMedia.twitter.points}</Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>Twitter</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center', marginLeft: 4 }}>
            <Ionicons name="logo-youtube" size={28} color="#dc2626" />
            <Text style={{ fontWeight: 'bold', color: '#dc2626', fontSize: 16 }}>{stats.socialMedia.youtube.points}</Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>YouTube</Text>
          </View>
        </View>

        {/* Actions Performed */}
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#0f172a', marginBottom: 8 }}>Actions Performed</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {stats.actions.map((action, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 8, marginBottom: 8, minWidth: '48%', marginRight: idx % 2 === 0 ? 8 : 0 }}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>{action.icon}</Text>
                <Text style={{ fontSize: 14, color: '#0f172a' }}>{action.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Media Kit Connection Cards (Instagram, YouTube, Twitter) */}
        {/* Instagram */}
        <View style={{ backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ backgroundColor: '#fce7f3', borderRadius: 20, padding: 8, marginRight: 12 }}>
              <Ionicons name="logo-instagram" size={24} color="#db2777" />
            </View>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#db2777', flex: 1 }}>Instagram Analytics</Text>
            {isConnected ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 }} />
                <Text style={{ color: '#22c55e', fontWeight: 'bold' }}>Connected</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={{ backgroundColor: '#db2777', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}
                onPress={() => setShowInstagramInput(true)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Connect Instagram</Text>
              </TouchableOpacity>
            )}
          </View>
          {showInstagramInput && (
            <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', color: '#db2777' }}>Enter your Instagram username:</Text>
                <TouchableOpacity onPress={() => setShowInstagramInput(false)}>
                  <Ionicons name="close" size={20} color="#db2777" />
                </TouchableOpacity>
              </View>
              <TextInput
                value={instagramUsername}
                onChangeText={setInstagramUsername}
                placeholder="username"
                style={{ backgroundColor: '#f3f4f6', borderRadius: 6, padding: 10, marginBottom: 8, color: '#db2777' }}
                placeholderTextColor="#db2777"
                onSubmitEditing={handleConnectInstagram}
              />
              <TouchableOpacity
                style={{ backgroundColor: '#db2777', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}
                onPress={handleConnectInstagram}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isLoading ? 'Connecting...' : 'Connect'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* YouTube */}
        <View style={{ backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ backgroundColor: '#fee2e2', borderRadius: 20, padding: 8, marginRight: 12 }}>
              <Ionicons name="logo-youtube" size={24} color="#dc2626" />
            </View>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#dc2626', flex: 1 }}>YouTube Analytics</Text>
            {isYtConnected ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 }} />
                <Text style={{ color: '#22c55e', fontWeight: 'bold' }}>Connected</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={{ backgroundColor: '#dc2626', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}
                onPress={() => setShowYoutubeInput(true)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Connect YouTube</Text>
              </TouchableOpacity>
            )}
          </View>
          {showYoutubeInput && (
            <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>Enter your YouTube username:</Text>
                <TouchableOpacity onPress={() => setShowYoutubeInput(false)}>
                  <Ionicons name="close" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
              <TextInput
                value={youtubeUsername}
                onChangeText={setYoutubeUsername}
                placeholder="username"
                style={{ backgroundColor: '#f3f4f6', borderRadius: 6, padding: 10, marginBottom: 8, color: '#dc2626' }}
                placeholderTextColor="#dc2626"
                onSubmitEditing={handleConnectYouTube}
              />
              <TouchableOpacity
                style={{ backgroundColor: '#dc2626', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}
                onPress={handleConnectYouTube}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isLoading ? 'Connecting...' : 'Connect'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Twitter */}
        <View style={{ backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ backgroundColor: '#e0e7ff', borderRadius: 20, padding: 8, marginRight: 12 }}>
              <Ionicons name="logo-twitter" size={24} color="#2563eb" />
            </View>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#2563eb', flex: 1 }}>Twitter Analytics</Text>
            {isTwitterConnected ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 }} />
                <Text style={{ color: '#22c55e', fontWeight: 'bold' }}>Connected</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={{ backgroundColor: '#2563eb', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 }}
                onPress={() => setShowTwitterInput(true)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Connect Twitter</Text>
              </TouchableOpacity>
            )}
          </View>
          {showTwitterInput && (
            <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', color: '#2563eb' }}>Enter your Twitter username:</Text>
                <TouchableOpacity onPress={() => setShowTwitterInput(false)}>
                  <Ionicons name="close" size={20} color="#2563eb" />
                </TouchableOpacity>
              </View>
              <TextInput
                value={twitterUsername}
                onChangeText={setTwitterUsername}
                placeholder="@username"
                style={{ backgroundColor: '#f3f4f6', borderRadius: 6, padding: 10, marginBottom: 8, color: '#2563eb' }}
                placeholderTextColor="#2563eb"
                onSubmitEditing={handleConnectTwitter}
              />
              <TouchableOpacity
                style={{ backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}
                onPress={handleConnectTwitter}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{isLoading ? 'Connecting...' : 'Connect'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <ActivityIndicator size="large" color="#14b8a6" style={{ marginTop: 32 }} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
} 