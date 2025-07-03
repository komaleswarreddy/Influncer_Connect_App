import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useCampaignStore } from '../../store/campaign-store';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CampaignDetailsProps {
  campaignId?: string;
  onClose?: () => void;
}

export default function CampaignDetailsScreen({ campaignId, onClose }: CampaignDetailsProps) {
  const {
    fetchCampaign,
    fetchParticipations,
    joinCampaign,
    participations,
    isLoading,
    error,
    clearError,
  } = useCampaignStore();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFull, setShowFull] = useState<{desc: boolean, guidelines: boolean, objectives: boolean}>({desc: false, guidelines: false, objectives: false});

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
    return <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}><ActivityIndicator size="large" color="#14b8a6" /></SafeAreaView>;
  }
  if (!campaign) {
    return <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}><Text>Campaign not found.</Text></SafeAreaView>;
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
      await joinCampaign(campaignId as string);
      Alert.alert('Success', 'You have successfully joined the campaign!');
      if (onClose) onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to join campaign');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 18 }}>
        {/* Back Button */}
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back to Campaigns</Text>
        </TouchableOpacity>
        {/* Card Layout */}
        <View style={styles.cardContainer}>
          {/* Card Header */}
          <View style={styles.headerCard}>
            <Text style={styles.campaignName}>{campaign.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Text style={styles.statusBadge}>{campaign.status}</Text>
              <Text style={styles.typeBadge}>{campaign.type}</Text>
              <Text style={styles.commission}>{campaign.commissionRate ? `${campaign.commissionRate}% Commission` : 'N/A'}</Text>
            </View>
          </View>
          {/* Card Body */}
          <View style={styles.bodyCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Start Date:</Text>
              <Text style={styles.infoValue}>{campaign.startDate?.slice(0, 10)}</Text>
              <Text style={styles.infoLabel}>End Date:</Text>
              <Text style={styles.infoValue}>{campaign.endDate?.slice(0, 10) || 'Ongoing'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Target Age:</Text>
              <Text style={styles.infoValue}>{campaign.targetAudienceAgeGroup}</Text>
              <Text style={styles.infoLabel}>Niche:</Text>
              <Text style={styles.infoValue}>{campaign.requiredInfluencerNiche}</Text>
            </View>
            <View style={styles.section}><Text style={styles.sectionTitle}>Description</Text>{renderReadMore(campaign.description, 'desc')}</View>
            {campaign.contentRequirements && campaign.contentRequirements.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Content Requirements</Text>
                {campaign.contentRequirements.map((req: any, index: number) => (
                  <View key={index} style={{ marginBottom: 8 }}>
                    <Text style={styles.sectionText}>
                      • {req.count} {req.type.replace('_', ' ')}s
                      {req.schedule && ` (${req.schedule})`}
                    </Text>
                    {req.description && (
                      <Text style={[styles.sectionText, { marginTop: 4, color: '#6b7280' }]}>
                        {req.description}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
            <View style={styles.section}><Text style={styles.sectionTitle}>Basic Guidelines</Text>{renderReadMore(campaign.basicGuidelines, 'guidelines')}</View>
            <View style={styles.section}><Text style={styles.sectionTitle}>Preferred Platform</Text><Text style={styles.sectionText}>{campaign.preferredSocialMedia}</Text></View>
            {participation && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Participation</Text>
                <Text style={styles.sectionText}>Status: {participation.status}</Text>
                <Text style={styles.sectionText}>Joined: {participation.joinedAt?.slice(0, 10)}</Text>
                {participation.promotionalCodes && (
                  <Text style={styles.sectionText}>Promo Codes: {participation.promotionalCodes.join(', ')}</Text>
                )}
              </View>
            )}
            {!isJoined && !isApplied && (
              <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                <Text style={styles.applyBtnText}>Apply for Campaign</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 18,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#e0f2f1',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerCard: {
    backgroundColor: '#14b8a6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  campaignName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    backgroundColor: '#fff',
    color: '#14b8a6',
    fontWeight: 'bold',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    fontSize: 13,
  },
  typeBadge: {
    backgroundColor: '#5eead4',
    color: '#134e4a',
    fontWeight: 'bold',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    fontSize: 13,
  },
  commission: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  bodyCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  readMore: {
    color: '#14b8a6',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 4,
  },
  applyBtn: {
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 