import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useCampaignStore } from '../../store/campaign-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appShell, premiumNavy, radius, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

interface CampaignDetailsProps {
  campaignId?: string;
  onClose?: () => void;
  onApplySuccess?: (participation: any) => void;
}

export default function CampaignDetailsScreen({ campaignId, onClose, onApplySuccess }: CampaignDetailsProps) {
  const {
    fetchCampaign,
    fetchParticipations,
    joinCampaign,
    participations,
    isLoading,
  } = useCampaignStore();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFull, setShowFull] = useState<{desc: boolean, guidelines: boolean}>({desc: false, guidelines: false});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (campaignId) {
        const c = await fetchCampaign(campaignId);
        await fetchParticipations();
        setCampaign(c);
      }
      setLoading(false);
    };
    load();
  }, [campaignId]);

  if (loading || isLoading) {
    return <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: appShell.canvas }}><ActivityIndicator size="large" color={appShell.cta} /></SafeAreaView>;
  }
  if (!campaign) {
    return <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: appShell.canvas }}><Text>Campaign not found.</Text></SafeAreaView>;
  }

  const participation = participations.find(p => p.campaignId === campaignId);
  const isJoined = participation && participation.status === 'joined';
  const isApplied = participation && participation.status === 'applied';

  const renderReadMore = (text: string, field: keyof typeof showFull, limit: number = 120) => {
    if (!text) return null;
    const isLong = text.length > limit;
    const displayText = !isLong || showFull[field] ? text : text.slice(0, limit) + '...';
    return (
      <>
        <Text style={styles.sectionText}>{displayText}</Text>
        {isLong && (
          <TouchableOpacity onPress={() => setShowFull(s => ({ ...s, [field]: !s[field] }))}>
            <Text style={styles.readMore}>{showFull[field] ? 'Show less' : 'Read more'}</Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  const handleApply = async () => {
    try {
      const participation = await joinCampaign(campaignId as string);
      
      // Call the callback to pass participation data to parent
      if (onApplySuccess) {
        onApplySuccess(participation);
      } else {
        // Fallback: show alert and close modal
        Alert.alert(
          'Success', 
          'You have successfully applied for the campaign! Please review and sign the contract.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onClose) onClose();
              }
            }
          ]
        );
      }
    } catch (e: any) {
      console.error('Error in handleApply:', e);
      Alert.alert('Error', e.message || 'Failed to join campaign');
    }
  };

  const handleCopyPromo = (code: string) => {
    Alert.alert('Promo Code', `${code} copied. Paste it in your campaign link setup.`);
  };

  const participationStatus = String(participation?.status || '').toLowerCase();
  const participationPillStyle =
    participationStatus === 'joined' || participationStatus === 'active'
      ? styles.participationPillSuccess
      : participationStatus === 'applied' || participationStatus === 'pending'
        ? styles.participationPillPending
        : participationStatus === 'completed'
          ? styles.participationPillCompleted
          : styles.participationPillNeutral;
  const participationPillTextStyle =
    participationStatus === 'joined' || participationStatus === 'active'
      ? styles.participationPillTextSuccess
      : participationStatus === 'applied' || participationStatus === 'pending'
        ? styles.participationPillTextPending
        : participationStatus === 'completed'
          ? styles.participationPillTextCompleted
          : styles.participationPillTextNeutral;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: appShell.canvas }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[...premiumNavy.base.colors]}
            locations={[...premiumNavy.base.locations]}
            start={premiumNavy.base.start}
            end={premiumNavy.base.end}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[...premiumNavy.sheen.colors]}
            locations={[...premiumNavy.sheen.locations]}
            start={premiumNavy.sheen.start}
            end={premiumNavy.sheen.end}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Text style={styles.heroOverline}>{String(campaign.type || 'Campaign').replace('_', ' ')}</Text>
          <Text style={styles.campaignName}>{campaign.name}</Text>
          <View style={styles.heroBadgeRow}>
            <Text style={styles.statusBadge}>{String(campaign.status || 'active').toUpperCase()}</Text>
            <Text style={styles.commission}>{campaign.commissionRate ? `${campaign.commissionRate}% Commission` : 'Commission N/A'}</Text>
          </View>
        </View>

        <View style={styles.surfaceCard}>
          <Text style={styles.sectionTitle}>Campaign Timeline</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Start Date</Text>
              <Text style={styles.infoValue}>{campaign.startDate?.slice(0, 10)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>End Date</Text>
              <Text style={styles.infoValue}>{campaign.endDate?.slice(0, 10) || 'Ongoing'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Target Age</Text>
              <Text style={styles.infoValue}>{campaign.targetAudienceAgeGroup}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Niche</Text>
              <Text style={styles.infoValue}>{campaign.requiredInfluencerNiche}</Text>
            </View>
          </View>
        </View>

        <View style={styles.surfaceCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          {renderReadMore(campaign.description, 'desc', 180)}
        </View>

        {campaign.contentRequirements && campaign.contentRequirements.length > 0 && (
          <View style={styles.surfaceCard}>
            <Text style={styles.sectionTitle}>Content Requirements</Text>
            {campaign.contentRequirements.map((req: any, index: number) => (
              <View key={index} style={styles.requirementItem}>
                <View style={styles.requirementIconTile}>
                  <Ionicons name={index % 2 === 0 ? 'videocam' : 'document-text'} size={14} color="#FFFFFF" />
                </View>
                <View style={styles.requirementBody}>
                  <Text style={styles.requirementTitle}>
                    {req.count}x {String(req.type).replace('_', ' ')}
                    {req.schedule ? ` (${req.schedule})` : ''}
                  </Text>
                  {req.description ? <Text style={styles.requirementText}>{req.description}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.surfaceCard}>
          <Text style={styles.sectionTitle}>Basic Guidelines</Text>
          {renderReadMore(campaign.basicGuidelines, 'guidelines', 180)}
        </View>

        <View style={styles.surfaceCard}>
          <Text style={styles.sectionTitle}>Preferred Platform</Text>
          <Text style={styles.sectionText}>{campaign.preferredSocialMedia}</Text>
        </View>

        {participation && (
          <View style={styles.surfaceCard}>
            <Text style={styles.sectionTitle}>Your Participation</Text>
            <View style={styles.participationRow}>
              <Text style={styles.participationLabel}>Participation</Text>
              <View style={[styles.participationPill, participationPillStyle]}>
                <Text style={[styles.participationPillText, participationPillTextStyle]}>
                  Status: {participation.status}
                </Text>
              </View>
            </View>
            <Text style={styles.sectionText}>Joined: {participation.joinedAt?.slice(0, 10)}</Text>
            {participation.promotionalCodes && participation.promotionalCodes.length > 0 ? (
              <View style={styles.promoOuterCard}>
                <Text style={styles.promoLabel}>Campaign Promo Code</Text>
                <View style={styles.promoInnerCard}>
                  <Text style={styles.promoCodeText}>{participation.promotionalCodes[0]}</Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopyPromo(participation.promotionalCodes[0])}>
                    <Ionicons name="copy-outline" size={16} color={appShell.cta} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {!isJoined && !isApplied ? (
          <PrimaryButton label="Apply for Campaign" onPress={handleApply} />
        ) : (
          <View style={styles.statusCard}>
            <Text style={styles.statusCardTitle}>{isApplied ? 'Application Submitted' : 'Campaign Joined'}</Text>
            <Text style={styles.statusCardText}>
              {isApplied ? 'Review and sign your contract in My Campaigns.' : 'Track your progress from My Campaigns.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  heroCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    padding: spacing.md,
    minHeight: 170,
    justifyContent: 'space-between',
  },
  heroOverline: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10,
    fontFamily: fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  campaignName: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fonts.bold,
    color: '#fff',
    marginTop: spacing.xs,
    maxWidth: '88%',
  },
  heroBadgeRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    color: '#fff',
    fontFamily: fonts.semiBold,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  commission: {
    color: '#fff',
    fontFamily: fonts.semiBold,
    fontSize: 12,
    opacity: 0.9,
  },
  surfaceCard: {
    backgroundColor: appShell.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.sm,
    columnGap: spacing.sm,
  },
  infoItem: {
    width: '47%',
    backgroundColor: appShell.canvasAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: appShell.cardBorder,
    padding: spacing.sm,
  },
  infoLabel: {
    color: appShell.textMuted,
    fontSize: 10,
    fontFamily: fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    color: appShell.textPrimary,
    fontSize: 13,
    fontFamily: fonts.semiBold,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: appShell.cta,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    color: appShell.textPrimary,
    lineHeight: 22,
    fontFamily: fonts.regular,
    opacity: 0.86,
  },
  requirementItem: {
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: appShell.borderSubtle,
  },
  requirementIconTile: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appShell.cta,
    marginTop: 2,
  },
  requirementBody: {
    flex: 1,
  },
  requirementTitle: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: appShell.textPrimary,
    marginBottom: 3,
  },
  requirementText: {
    fontSize: 13,
    color: appShell.textSecondary,
    lineHeight: 19,
    fontFamily: fonts.regular,
  },
  readMore: {
    color: appShell.cta,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    marginTop: 4,
  },
  statusCard: {
    marginTop: spacing.xs,
    backgroundColor: appShell.iceBlue,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: appShell.cardBorder,
    padding: spacing.md,
  },
  statusCardTitle: {
    color: appShell.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 14,
    marginBottom: 4,
  },
  statusCardText: {
    color: appShell.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  participationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  participationLabel: {
    color: appShell.textMuted,
    fontSize: 11,
    fontFamily: fonts.semiBold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  participationPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  participationPillText: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
  },
  participationPillNeutral: {
    backgroundColor: appShell.canvasAlt,
    borderColor: appShell.cardBorder,
  },
  participationPillTextNeutral: {
    color: appShell.textPrimary,
  },
  participationPillSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderColor: 'rgba(22, 163, 74, 0.35)',
  },
  participationPillTextSuccess: {
    color: '#166534',
  },
  participationPillPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderColor: 'rgba(217, 119, 6, 0.35)',
  },
  participationPillTextPending: {
    color: '#92400E',
  },
  participationPillCompleted: {
    backgroundColor: 'rgba(79, 110, 247, 0.14)',
    borderColor: 'rgba(55, 65, 81, 0.22)',
  },
  participationPillTextCompleted: {
    color: appShell.cta,
  },
  promoOuterCard: {
    marginTop: spacing.sm,
    backgroundColor: appShell.canvasAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: appShell.cardBorder,
    padding: spacing.sm,
  },
  promoLabel: {
    color: appShell.textMuted,
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  promoInnerCard: {
    backgroundColor: appShell.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: appShell.cardBorder,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoCodeText: {
    color: appShell.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: 1.1,
  },
  copyBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appShell.iceBlue,
  },
}); 