import React, { useCallback, useEffect, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  useCampaignStore,
  type Campaign,
  type ParticipationCampaignEmbed,
} from '@/store/campaign-store';
import { useInfluencerStore } from '@/store/influencer-store';
import {
  PremiumCard,
  PremiumTextInput,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from '@/components/ui';
import { appShell, palette, radius, shadow, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';

function resolveCampaignDisplay(
  listCampaign: Campaign | undefined,
  embedded: ParticipationCampaignEmbed | null | undefined
): {
  title: string;
  brandName: string;
} | null {
  const emb = embedded ?? undefined;
  const title = listCampaign?.name ?? emb?.name;
  if (!title) return null;
  const brandName = listCampaign?.tenant?.tenantName ?? emb?.tenant?.tenantName ?? 'Brand';
  return { title, brandName };
}

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

export default function RatingCardsScreen() {
  const { participations, campaigns, fetchParticipations, fetchCampaigns, isLoading: campaignsLoading } =
    useCampaignStore();
  const {
    ratings,
    adminRatings,
    ratingsLoading,
    ratingsError,
    fetchRatings,
    submitRating,
    fetchBrandRatings,
  } = useInfluencerStore();

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [selectedParticipation, setSelectedParticipation] = useState<{ id: string } | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [review, setReview] = useState('');
  const [brandModalParticipation, setBrandModalParticipation] = useState<{
    id: string;
    influencerId: string;
    campaignId: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        await fetchCampaigns();
        await fetchParticipations();
        const { participations: parts } = useCampaignStore.getState();
        if (cancelled) return;
        await Promise.all(parts.map((p) => fetchRatings(p.id)));
      })();
      return () => {
        cancelled = true;
      };
    }, [fetchCampaigns, fetchParticipations, fetchRatings])
  );

  useEffect(() => {
    participations.forEach((p) => {
      void fetchRatings(p.id);
    });
  }, [participations, fetchRatings]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCampaigns();
      await fetchParticipations();
      const { participations: parts } = useCampaignStore.getState();
      await Promise.all(parts.map((p) => fetchRatings(p.id)));
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenRating = (participation: { id: string }) => {
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
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to submit rating';
      Alert.alert('Error', msg);
    }
  };

  const handleOpenBrandRatings = async (participation: {
    influencerId: string;
    campaignId: string;
    id: string;
  }) => {
    setBrandModalParticipation(participation);
    await fetchBrandRatings(participation.influencerId, participation.campaignId, participation.id);
    setShowBrandModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <SectionHeader title="Campaign ratings" subtitle="Rate partnerships and view brand feedback" />
        {(ratingsLoading || campaignsLoading) && (
          <ActivityIndicator size="large" color={appShell.cta} style={{ marginVertical: spacing.md }} />
        )}
        {ratingsError ? <Text style={styles.errorText}>{ratingsError}</Text> : null}
        {participations.length === 0 && !ratingsLoading && !campaignsLoading ? (
          <Text style={styles.emptyText}>No campaign participations found.</Text>
        ) : (
          participations.map((p) => {
            const display = resolveCampaignDisplay(
              campaigns.find((c) => c.id === p.campaignId),
              p.campaign ?? undefined
            );
            if (!display) return null;
            const rating = ratings[p.id];

            return (
              <PremiumCard key={p.id} style={styles.ratingCard}>
                <Text style={styles.cardTitle}>{display.title}</Text>
                <Text style={styles.cardSubtitle}>{display.brandName}</Text>
                <View style={styles.ratingBlock}>
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>Your rating</Text>
                    {rating ? (
                      <StarRatingDisplay rating={rating.overallRating} />
                    ) : (
                      <Text style={styles.notRated}>Not rated yet</Text>
                    )}
                  </View>
                  {rating?.review ? (
                    <Text style={styles.reviewSnippet} numberOfLines={6}>
                      {rating.review}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.cardActions}>
                  {!rating ? (
                    <PrimaryButton compact label="Rate campaign" onPress={() => handleOpenRating(p)} />
                  ) : null}
                  {rating ? (
                    <PrimaryButton
                      compact
                      label="View brand ratings"
                      onPress={() => handleOpenBrandRatings(p)}
                    />
                  ) : (
                    <SecondaryButton
                      label="View brand ratings"
                      onPress={() => handleOpenBrandRatings(p)}
                    />
                  )}
                </View>
              </PremiumCard>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showRatingModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate campaign</Text>
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
            <PrimaryButton style={styles.modalBtn} label="Submit rating" onPress={handleSubmitRating} />
            <SecondaryButton style={styles.modalBtn} label="Cancel" onPress={() => setShowRatingModal(false)} />
          </View>
        </View>
      </Modal>

      <Modal visible={showBrandModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Brand ratings</Text>
            {brandModalParticipation &&
            adminRatings[brandModalParticipation.id] &&
            adminRatings[brandModalParticipation.id].length > 0 ? (
              adminRatings[brandModalParticipation.id].map((r, idx) => (
                <View key={r.id || idx} style={styles.brandRatingCard}>
                  <StarRatingDisplay rating={r.overallRating} />
                  {r.status !== 'approved' ? <Text style={styles.pendingBadge}>Pending review</Text> : null}
                  {r.review ? <Text style={styles.brandRatingText}>{r.review}</Text> : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No brand ratings yet.</Text>
            )}
            <SecondaryButton
              style={styles.modalBtn}
              label="Close"
              onPress={() => setShowBrandModal(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: appShell.canvas },
  content: { padding: spacing.md, paddingBottom: spacing.lg },
  ratingCard: { marginBottom: spacing.sm },
  cardTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: appShell.textPrimary },
  cardSubtitle: { marginTop: 2, fontFamily: fonts.regular, fontSize: 13, color: appShell.textSecondary },
  ratingBlock: {
    marginTop: spacing.sm,
    backgroundColor: appShell.canvasAlt,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.borderSubtle,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  ratingLabel: { color: appShell.textPrimary, fontFamily: fonts.semiBold, fontSize: 13 },
  notRated: { color: appShell.textMuted, fontFamily: fonts.regular, fontSize: 13 },
  reviewSnippet: {
    marginTop: spacing.xs,
    color: appShell.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  cardActions: { marginTop: spacing.sm, gap: spacing.xs },
  errorText: { color: palette.error, marginBottom: spacing.sm, fontFamily: fonts.regular },
  emptyText: { color: appShell.textSecondary, fontFamily: fonts.regular },
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
  modalTitle: { fontSize: 17, fontFamily: fonts.bold, color: appShell.cta, marginBottom: 10 },
  starRow: { flexDirection: 'row', marginBottom: 12 },
  reviewInput: { width: '100%', minHeight: 60, marginBottom: 12 },
  modalBtn: { alignSelf: 'stretch', width: '100%', marginTop: spacing.sm },
  brandRatingCard: {
    backgroundColor: appShell.iceBlue,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    alignSelf: 'stretch',
  },
  brandRatingText: {
    color: appShell.textPrimary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.regular,
  },
  pendingBadge: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: appShell.textMuted,
  },
});
