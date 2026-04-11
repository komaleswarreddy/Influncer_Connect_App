import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../../store/campaign-store';
import { useInfluencerStore } from '../../../store/influencer-store';
import {
  PremiumCampaignFeedCard,
  PremiumTextInput,
  PrimaryButton,
  SecondaryButton,
  type FeedMetaRow,
} from '@/components/ui';
import { appShell, palette, radius, shadow, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';

const SHORT_MONTH_DAY = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={18}
          color={i <= rating ? '#F59E0B' : appShell.textMuted}
        />
      ))}
    </View>
  );
}

export default function RatingsScreen() {
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
      backgroundColor: appShell.canvas,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.lg,
    },
    pageTitle: {
      fontSize: 18,
      fontFamily: fonts.bold,
      color: appShell.cta,
      marginBottom: spacing.sm,
      letterSpacing: -0.3,
    },
    ratingBlock: {
      backgroundColor: appShell.canvasAlt,
      borderRadius: radius.md,
      padding: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: appShell.borderSubtle,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    ratingLabel: {
      color: appShell.textPrimary,
      fontFamily: fonts.semiBold,
      fontSize: 13,
    },
    reviewSnippet: {
      marginTop: spacing.xs,
      color: appShell.textSecondary,
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 19,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
      backgroundColor: appShell.card,
      borderRadius: radius.xl,
      padding: spacing.md,
      width: '88%',
      maxWidth: 400,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: appShell.cardBorder,
      ...shadow.card,
    },
    modalTitle: {
      fontSize: 17,
      fontFamily: fonts.bold,
      color: appShell.cta,
      marginBottom: 10,
    },
    starRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    reviewInput: {
      width: '100%',
      minHeight: 60,
      marginBottom: 12,
    },
    modalActions: {
      alignSelf: 'stretch',
      width: '100%',
      marginTop: spacing.sm,
    },
    modalPrimaryCta: {
      alignSelf: 'stretch',
      width: '100%',
      marginTop: spacing.md,
    },
    cardSecondaryCtaCompact: {
      paddingVertical: 9,
      minHeight: 38,
    },
    adminRatingCard: {
      backgroundColor: appShell.iceBlue,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.xs,
    },
    adminRatingText: {
      color: appShell.textPrimary,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: fonts.regular,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text style={styles.pageTitle}>Campaign Ratings</Text>
        {(ratingsLoading || campaignsLoading) && <ActivityIndicator size="large" color={appShell.cta} style={{ marginVertical: 16 }} />}
        {ratingsError && <Text style={{ color: palette.error, marginBottom: spacing.sm }}>{ratingsError}</Text>}
        {participations.length === 0 && !ratingsLoading && !campaignsLoading ? (
          <Text style={{ color: appShell.textSecondary, fontFamily: fonts.regular }}>No campaign participations found.</Text>
        ) : (
          participations.map((p) => {
            const campaign = campaigns.find(c => c.id === p.campaignId);
            const rating = ratings[p.id];
            if (!campaign) return null;
            const formatDurationRange = (startDate?: string, endDate?: string) => {
              const start = startDate ? new Date(startDate) : null;
              const end = endDate ? new Date(endDate) : null;
              const startValid = !!start && !Number.isNaN(start.getTime());
              const endValid = !!end && !Number.isNaN(end.getTime());

              if (startValid && endValid) {
                return `${SHORT_MONTH_DAY.format(start)}-${SHORT_MONTH_DAY.format(end)}`;
              }
              if (startValid) {
                return `Starts ${SHORT_MONTH_DAY.format(start)}`;
              }
              return 'TBD';
            };

            const metaRows: FeedMetaRow[] = [
              { label: 'Brand', value: String(campaign.tenant?.tenantName ?? 'Unknown') },
              { label: 'Commission', value: campaign.commissionRate != null ? `${campaign.commissionRate}%` : 'N/A' },
              {
                label: 'Duration',
                value: formatDurationRange(campaign.startDate, campaign.endDate),
              },
            ];

            return (
              <PremiumCampaignFeedCard
                key={p.id}
                style={{ marginBottom: spacing.sm }}
                title={campaign.name}
                statusLabel={String(campaign.status)}
                description={undefined}
                metaRows={metaRows}
                bodyExtra={
                  <View style={styles.ratingBlock}>
                    <View style={styles.ratingRow}>
                      <Text style={styles.ratingLabel}>Your rating</Text>
                      {rating ? (
                        <StarRatingDisplay rating={rating.overallRating} />
                      ) : (
                        <Text style={{ color: appShell.textMuted, fontFamily: fonts.regular, fontSize: 13 }}>Not rated yet</Text>
                      )}
                    </View>
                    {rating?.review ? (
                      <Text style={styles.reviewSnippet} numberOfLines={6}>
                        {rating.review}
                      </Text>
                    ) : null}
                  </View>
                }
                footer={
                  <>
                    {!rating ? (
                      <PrimaryButton compact label="Rate Campaign" onPress={() => handleOpenRating(p)} />
                    ) : null}
                    {rating ? (
                      <PrimaryButton
                        compact
                        label="View Admin Ratings"
                        onPress={() => handleOpenAdminRatings(p)}
                      />
                    ) : (
                      <SecondaryButton
                        style={styles.cardSecondaryCtaCompact}
                        label="View Admin Ratings"
                        onPress={() => handleOpenAdminRatings(p)}
                      />
                    )}
                  </>
                }
              />
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
                    size={28}
                    color={i <= ratingValue ? '#F59E0B' : appShell.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <PremiumTextInput
              style={styles.reviewInput}
              placeholder="Write a review (optional)"
              value={review}
              onChangeText={setReview}
              multiline
              maxLength={500}
            />
            <PrimaryButton style={styles.modalActions} label="Submit Rating" onPress={handleSubmitRating} />
            <SecondaryButton
              style={styles.modalActions}
              label="Cancel"
              onPress={() => setShowRatingModal(false)}
            />
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
                  {r.review ? (
                    <Text style={[styles.adminRatingText, { marginTop: 8, fontStyle: 'italic' }]}>{r.review}</Text>
                  ) : (
                    <Text style={[styles.adminRatingText, { marginTop: 8 }]}>No review text.</Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.adminRatingText}>No admin ratings yet.</Text>
            )}
            <PrimaryButton
              compact
              style={styles.modalPrimaryCta}
              label="Close"
              onPress={() => setShowAdminModal(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 