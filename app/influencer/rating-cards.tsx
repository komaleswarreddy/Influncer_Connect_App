import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  useCampaignStore,
  type Campaign,
  type CampaignParticipation,
  type ParticipationCampaignEmbed,
} from '@/store/campaign-store';
import { useInfluencerStore } from '@/store/influencer-store';
import { KollabButton } from '@/components/ui/KollabButton';
import { KollabScreenHeader } from '@/components/ui/KollabScreenHeader';
import { KollabTextField } from '@/components/ui/KollabTextField';
import { showKollabToast } from '@/components/ui/PremiumToast';
import { KollabStatusChip } from '@/components/ui/KollabStatusChip';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function resolveCampaignDisplay(
  listCampaign: Campaign | undefined,
  embedded: ParticipationCampaignEmbed | null | undefined
): { title: string; brandName: string } | null {
  const emb = embedded ?? undefined;
  const title = listCampaign?.name ?? emb?.name;
  if (!title) return null;
  const brandName = listCampaign?.tenant?.tenantName ?? emb?.tenant?.tenantName ?? 'Brand';
  return { title, brandName };
}

function brandInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'BR';
}

function formatDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return DATE_FMT.format(d);
}

export default function RatingCardsScreen() {
  const kollab = useKollab();
  const styles = useKollabStyles(kollab);
  const {
    participations,
    campaigns,
    fetchParticipations,
    fetchCampaigns,
    isLoading: campaignsLoading,
  } = useCampaignStore();
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

  const handleOpenRating = useCallback((participation: { id: string }) => {
    setSelectedParticipation(participation);
    setRatingValue(0);
    setReview('');
    setShowRatingModal(true);
  }, []);

  const handleSubmitRating = async () => {
    if (!selectedParticipation) return;
    if (ratingValue === 0) {
      showKollabToast('Please select a rating');
      return;
    }
    try {
      await submitRating(selectedParticipation.id, ratingValue, review);
      setShowRatingModal(false);
      setSelectedParticipation(null);
      setRatingValue(0);
      setReview('');
      showKollabToast('Rating submitted successfully!');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to submit rating';
      showKollabToast(msg);
    }
  };

  const handleOpenBrandRatings = useCallback(
    async (participation: { influencerId: string; campaignId: string; id: string }) => {
      setBrandModalParticipation(participation);
      await fetchBrandRatings(
        participation.influencerId,
        participation.campaignId,
        participation.id
      );
      setShowBrandModal(true);
    },
    [fetchBrandRatings]
  );

  const ratedValues = Object.values(ratings).filter(
    (r): r is NonNullable<typeof r> => r != null && Number.isFinite(r.overallRating)
  );
  const avg =
    ratedValues.length > 0
      ? ratedValues.reduce((sum, r) => sum + r.overallRating, 0) / ratedValues.length
      : 0;
  const avgLabel = ratedValues.length > 0 ? avg.toFixed(1).replace(/\.0$/, '') : '—';

  const keyExtractor = useCallback((p: CampaignParticipation) => p.id, []);

  const renderItem = useCallback(
    ({ item: p }: ListRenderItemInfo<CampaignParticipation>) => {
      const display = resolveCampaignDisplay(
        campaigns.find((c) => c.id === p.campaignId),
        p.campaign ?? undefined
      );
      if (!display) return null;
      const rating = ratings[p.id];
      const score = rating ? rating.overallRating.toFixed(1).replace(/\.0$/, '') : null;
      const date = formatDate(rating?.createdAt || p.completedAt || p.joinedAt);

      return (
        <View style={styles.ratingCard}>
          <View style={styles.cardTop}>
            <View style={styles.brandWell}>
              <Text style={styles.brandLetter}>{brandInitials(display.brandName)}</Text>
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {display.title}
              </Text>
              {date ? <Text style={styles.cardDate}>{date}</Text> : null}
            </View>
            {score ? (
              <View style={styles.scoreChip}>
                <Text style={styles.scoreChipText}>{score} ★</Text>
              </View>
            ) : (
              <KollabStatusChip tone="neutral" label="Unrated" />
            )}
          </View>
          {rating?.review ? <Text style={styles.reviewBody}>{rating.review}</Text> : null}
          <View style={styles.kindChip}>
            <Text style={styles.kindChipText}>Influencer to collab</Text>
          </View>
          <View style={styles.cardActions}>
            {!rating ? (
              <KollabButton compact label="Rate campaign" onPress={() => handleOpenRating(p)} />
            ) : null}
            <KollabButton
              compact
              variant={rating ? 'primary' : 'hairline'}
              label="View brand ratings"
              onPress={() => handleOpenBrandRatings(p)}
            />
          </View>
        </View>
      );
    },
    [campaigns, ratings, handleOpenRating, handleOpenBrandRatings, styles]
  );

  const listHeader = useMemo(
    () => (
      <>
        <KollabScreenHeader
          title="Collab ratings"
          subtitle="Rate partnerships and view brand feedback"
          backTone="card"
        />
        <View style={styles.panelCard}>
          <Text style={styles.panelEyebrow}>Your average</Text>
          <Text style={styles.panelMetric}>
            {avgLabel}
            <Text style={styles.panelMetricMuted}> / 5</Text>
          </Text>
          <Text style={styles.panelDelta}>
            {ratedValues.length > 0
              ? `Brand rating across ${ratedValues.length} completed collab${ratedValues.length === 1 ? '' : 's'}`
              : 'No ratings yet — rate a completed collab to see your average'}
          </Text>
        </View>
        {ratingsLoading || campaignsLoading ? (
          <ActivityIndicator size="large" color={kollab.color.ink} style={{ marginVertical: 16 }} />
        ) : null}
        {ratingsError ? <Text style={styles.errorText}>{ratingsError}</Text> : null}
      </>
    ),
    [ratingsLoading, campaignsLoading, ratingsError, styles, kollab, avgLabel, ratedValues.length]
  );

  const listEmpty =
    ratingsLoading || campaignsLoading ? null : (
      <Text style={styles.emptyText}>No campaign participations found.</Text>
    );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FlatList
        data={participations}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <Modal visible={showRatingModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate campaign</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Pressable key={i} onPress={() => setRatingValue(i)}>
                  <Text
                    style={{
                      fontSize: 28,
                      color: i <= ratingValue ? kollab.color.chartreuse : kollab.color.inkFaint,
                    }}
                  >
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>
            <KollabTextField
              style={styles.reviewInput}
              placeholder="Write a review (optional)"
              value={review}
              onChangeText={setReview}
              multiline
              maxLength={500}
              surface="well"
            />
            <KollabButton
              style={styles.modalBtn}
              variant="ink"
              label="Submit rating"
              onPress={handleSubmitRating}
            />
            <KollabButton
              style={styles.modalBtn}
              variant="hairline"
              label="Cancel"
              onPress={() => setShowRatingModal(false)}
            />
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
                  <View style={styles.scoreChip}>
                    <Text style={styles.scoreChipText}>
                      {r.overallRating.toFixed(1).replace(/\.0$/, '')} ★
                    </Text>
                  </View>
                  {r.status !== 'approved' ? (
                    <KollabStatusChip
                      tone="neutral"
                      label="Pending review"
                      style={styles.pendingBadge}
                    />
                  ) : null}
                  {r.review ? <Text style={styles.brandRatingText}>{r.review}</Text> : null}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No brand ratings yet.</Text>
            )}
            <KollabButton
              style={styles.modalBtn}
              variant="soft"
              label="Close"
              onPress={() => setShowBrandModal(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function useKollabStyles(kollab: KollabTokens) {
  return useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: kollab.color.screen },
        content: { paddingHorizontal: 22, paddingBottom: 40 },
        panelCard: {
          backgroundColor: kollab.color.panel,
          borderRadius: 24,
          padding: 22,
          marginBottom: 16,
        },
        panelEyebrow: {
          fontFamily: font.body,
          fontSize: 12,
          color: kollab.color.panelInk,
          opacity: 0.6,
        },
        panelMetric: {
          fontFamily: font.display,
          fontSize: 44,
          color: kollab.color.panelInk,
          marginVertical: 2,
        },
        panelMetricMuted: {
          fontFamily: font.display,
          fontSize: 24,
          color: kollab.color.panelInk,
          opacity: 0.45,
        },
        panelDelta: {
          fontFamily: font.semiBold,
          fontSize: 12,
          color: kollab.color.chartreuse,
        },
        ratingCard: {
          backgroundColor: kollab.color.card,
          borderRadius: 22,
          paddingVertical: 16,
          paddingHorizontal: 18,
          marginBottom: 10,
          ...kollab.shadow.card,
        },
        cardTop: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 11,
        },
        brandWell: {
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: kollab.color.violet,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        },
        brandLetter: {
          fontFamily: font.bold,
          fontSize: 12,
          color: kollab.color.inkOn,
        },
        cardCopy: { flex: 1, minWidth: 0 },
        cardTitle: {
          fontFamily: font.semiBold,
          fontSize: 13.5,
          color: kollab.color.ink,
        },
        cardDate: {
          fontFamily: font.body,
          fontSize: 11.5,
          color: kollab.color.ink,
          opacity: 0.55,
          marginTop: 2,
        },
        scoreChip: {
          backgroundColor: kollab.color.chartreuse,
          borderRadius: 999,
          paddingHorizontal: 11,
          paddingVertical: 5,
          flexShrink: 0,
        },
        scoreChipText: {
          fontFamily: font.bold,
          fontSize: 12,
          color: kollab.color.onChartreuse,
        },
        reviewBody: {
          fontFamily: font.body,
          fontSize: 13,
          lineHeight: 20,
          color: kollab.color.ink,
          opacity: 0.65,
          marginTop: 11,
        },
        kindChip: {
          alignSelf: 'flex-start',
          backgroundColor: kollab.color.tealTint,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 4,
          marginTop: 11,
        },
        kindChipText: {
          fontFamily: font.bold,
          fontSize: 10.5,
          color: kollab.color.teal,
        },
        cardActions: { marginTop: 12, gap: 8 },
        errorText: { color: kollab.color.heat, marginBottom: 12, fontFamily: font.body },
        emptyText: { color: kollab.color.inkMuted, fontFamily: font.body },
        modalContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(11,9,6,0.5)',
        },
        modalContent: {
          backgroundColor: kollab.color.card,
          borderRadius: 26,
          padding: 18,
          width: '88%',
          maxWidth: 400,
          alignItems: 'center',
          ...kollab.shadow.card,
        },
        modalTitle: {
          ...kType.sectionTitle,
          color: kollab.color.ink,
          marginBottom: 10,
        },
        starRow: { flexDirection: 'row', marginBottom: 12, gap: 4 },
        reviewInput: {
          width: '100%',
          minHeight: 60,
          marginBottom: 12,
        },
        modalBtn: { alignSelf: 'stretch', width: '100%', marginTop: 10 },
        brandRatingCard: {
          backgroundColor: kollab.color.well,
          borderRadius: 17,
          padding: 14,
          marginBottom: 8,
          alignSelf: 'stretch',
          gap: 8,
        },
        brandRatingText: {
          color: kollab.color.ink,
          fontSize: 13,
          lineHeight: 20,
          fontFamily: font.body,
          opacity: 0.65,
        },
        pendingBadge: { marginTop: 2 },
      }),
    [kollab]
  );
}
