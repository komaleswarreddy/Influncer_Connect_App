import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/campaign-store';
import { useInfluencerStore } from '../../store/influencer-store';
import { useAuthStore } from '../../store/auth-store';
import { useColorScheme } from '@/hooks/useColorScheme';

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={18}
          color={i <= rating ? '#FFD700' : '#ccc'}
        />
      ))}
    </View>
  );
}

export default function RatingsScreen() {
  const { user } = useAuthStore();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { participations, campaigns, fetchParticipations, fetchCampaigns, isLoading: campaignsLoading } = useCampaignStore();
  const {
    ratings,
    adminRatings,
    ratingsLoading,
    ratingsError,
    fetchRatings,
    submitRating,
    fetchAdminRatings,
  } = useInfluencerStore();

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedParticipation, setSelectedParticipation] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [review, setReview] = useState('');
  const [adminModalParticipation, setAdminModalParticipation] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchParticipations();
  }, [fetchCampaigns, fetchParticipations]);

  // Fetch ratings for all participations
  useEffect(() => {
    participations.forEach((p) => {
      fetchRatings(p.id);
    });
  }, [participations, fetchRatings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCampaigns();
    await fetchParticipations();
    setRefreshing(false);
  };

  const handleOpenRating = async (participation: any) => {
    setSelectedParticipation(participation);
    setRatingValue(0);
    setReview('');
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedParticipation) return;
    if (ratingValue === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    try {
      await submitRating(selectedParticipation.id, ratingValue, review);
      setShowRatingModal(false);
      setSelectedParticipation(null);
      setRatingValue(0);
      setReview('');
      Alert.alert('Success', 'Rating submitted successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit rating');
    }
  };

  const handleOpenAdminRatings = async (participation: any) => {
    setAdminModalParticipation(participation);
    await fetchAdminRatings(participation.influencerId, participation.campaignId, participation.id);
    setShowAdminModal(true);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8fafc',
    },
    content: {
      padding: 16,
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: 14,
      padding: 16,
      marginBottom: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: '#e0f2f1',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: 'bold',
      color: '#14b8a6',
    },
    cardStatus: {
      fontSize: 13,
      color: '#14b8a6',
      fontWeight: '600',
      backgroundColor: '#e0f2f1',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      overflow: 'hidden',
    },
    cardDesc: {
      color: '#334155',
      fontSize: 14,
      marginBottom: 8,
    },
    cardInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    cardInfo: {
      color: '#14b8a6',
      fontWeight: '600',
      fontSize: 13,
    },
    cardValue: {
      color: '#0f172a',
      fontWeight: 'bold',
      fontSize: 13,
    },
    rateButton: {
      backgroundColor: '#14b8a6',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 12,
      paddingHorizontal: 16,
      alignSelf: 'flex-start',
    },
    rateButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    adminButton: {
      backgroundColor: '#e0f2f1',
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: 'center',
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    adminButtonText: {
      color: '#14b8a6',
      fontWeight: 'bold',
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: 14,
      padding: 24,
      width: '85%',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#14b8a6',
      marginBottom: 12,
    },
    starRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    reviewInput: {
      width: '100%',
      minHeight: 60,
      borderColor: '#e0f2f1',
      borderWidth: 1,
      borderRadius: 8,
      padding: 8,
      color: '#0f172a',
      backgroundColor: '#f8fafc',
      marginBottom: 12,
    },
    submitButton: {
      backgroundColor: '#14b8a6',
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 8,
      paddingHorizontal: 20,
    },
    submitButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    closeButton: {
      marginTop: 16,
    },
    closeButtonText: {
      color: '#14b8a6',
      fontWeight: 'bold',
    },
    adminRatingCard: {
      backgroundColor: '#e0f2f1',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    adminRatingText: {
      color: '#0f172a',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#14b8a6', marginBottom: 16 }}>
          Campaign Ratings
        </Text>
        {(ratingsLoading || campaignsLoading) && <ActivityIndicator size="large" color="#14b8a6" style={{ marginVertical: 16 }} />}
        {ratingsError && <Text style={{ color: 'red', marginBottom: 8 }}>{ratingsError}</Text>}
        {participations.length === 0 && !ratingsLoading && !campaignsLoading ? (
          <Text>No campaign participations found.</Text>
        ) : (
          participations.map((p) => {
            const campaign = campaigns.find(c => c.id === p.campaignId);
            const rating = ratings[p.id];
            if (!campaign) return null;
            return (
              <View key={p.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{campaign.name}</Text>
                  <Text style={styles.cardStatus}>{campaign.status}</Text>
                </View>
                <Text style={styles.cardDesc} numberOfLines={3}>{campaign.description}</Text>
                <View style={styles.cardInfoRow}>
                  <Text style={styles.cardInfo}>Type: <Text style={styles.cardValue}>{campaign.type}</Text></Text>
                  <Text style={styles.cardInfo}>Commission: <Text style={styles.cardValue}>{campaign.commissionRate ? `${campaign.commissionRate}%` : 'N/A'}</Text></Text>
                </View>
                {campaign.tenant && (
                  <View style={styles.cardInfoRow}>
                    <Text style={styles.cardInfo}>Brand: <Text style={styles.cardValue}>{campaign.tenant.tenantName}</Text></Text>
                  </View>
                )}
                <View style={styles.cardInfoRow}>
                  <Text style={styles.cardInfo}>Start: <Text style={styles.cardValue}>{campaign.startDate?.slice(0, 10)}</Text></Text>
                  <Text style={styles.cardInfo}>End: <Text style={styles.cardValue}>{campaign.endDate?.slice(0, 10) || 'Ongoing'}</Text></Text>
                </View>
                <View style={styles.cardInfoRow}>
                  <Text style={styles.cardInfo}>Niche: <Text style={styles.cardValue}>{campaign.requiredInfluencerNiche}</Text></Text>
                  <Text style={styles.cardInfo}>Age: <Text style={styles.cardValue}>{campaign.targetAudienceAgeGroup}</Text></Text>
                </View>
                <View style={styles.ratingRow}>
                  <Text style={{ marginRight: 8 }}>Your Rating:</Text>
                  {rating ? (
                    <StarRatingDisplay rating={rating.overallRating} />
                  ) : (
                    <Text style={{ color: '#888' }}>Not rated</Text>
                  )}
                </View>
                {rating && rating.review && (
                  <Text style={{ marginTop: 4, color: '#555' }}>
                    "{rating.review}"
                  </Text>
                )}
                {!rating && (
                  <TouchableOpacity style={styles.rateButton} onPress={() => handleOpenRating(p)}>
                    <Text style={styles.rateButtonText}>Rate Campaign</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.adminButton} onPress={() => handleOpenAdminRatings(p)}>
                  <Text style={styles.adminButtonText}>View Admin Ratings</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
      {/* Rating Modal */}
      <Modal visible={showRatingModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate Campaign</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setRatingValue(i)}>
                  <Ionicons
                    name={i <= ratingValue ? 'star' : 'star-outline'}
                    size={32}
                    color={i <= ratingValue ? '#FFD700' : '#ccc'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Write a review (optional)"
              placeholderTextColor="#aaa"
              value={review}
              onChangeText={setReview}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRating}>
              <Text style={styles.submitButtonText}>Submit Rating</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowRatingModal(false)}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Admin Ratings Modal */}
      <Modal visible={showAdminModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Admin Ratings</Text>
            {adminModalParticipation && adminRatings[adminModalParticipation.id] && adminRatings[adminModalParticipation.id].length > 0 ? (
              adminRatings[adminModalParticipation.id].map((r, idx) => (
                <View key={r.id || idx} style={styles.adminRatingCard}>
                  <StarRatingDisplay rating={r.overallRating} />
                  {r.review && <Text style={styles.adminRatingText}>{r.review}</Text>}
                  <Text style={[styles.adminRatingText, { fontSize: 12, marginTop: 2 }]}>Status: {r.status}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.adminRatingText}>No admin ratings yet.</Text>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowAdminModal(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 