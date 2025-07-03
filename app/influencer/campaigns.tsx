import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, RefreshControl, Modal } from 'react-native';
import { useCampaignStore } from '../../store/campaign-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import CampaignDetailsScreen from '../../components/influencer/CampaignDetails';
import CampaignFilters from '../../components/influencer/CampaignFilters';
import { api } from '../../lib/api';

const TABS = [
  { key: 'available', label: 'Available Campaigns' },
  { key: 'my-campaigns', label: 'My Campaigns' },
];

export default function InfluencerCampaignsScreen() {
  const {
    campaigns,
    participations,
    isLoading,
    error,
    fetchCampaigns,
    fetchParticipations,
    joinCampaign,
    clearError,
  } = useCampaignStore();
  const [tab, setTab] = useState('available');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  const [filters, setFilters] = useState({
    targetAudienceAgeGroup: 'all',
    requiredNiche: 'all',
    dateRange: null as { from: Date | null; to: Date | null } | null,
    tenantId: 'all',
  });
  const [tenants, setTenants] = useState<Array<{
    id: string;
    tenantName: string;
    domain: string;
    subdomain: string;
    status: string;
  }>>([]);

  useEffect(() => {
    fetchCampaigns();
    fetchParticipations();
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/api/tenants');
      setTenants(response as Array<{
        id: string;
        tenantName: string;
        domain: string;
        subdomain: string;
        status: string;
      }>);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCampaigns();
    await fetchParticipations();
    await fetchTenants();
    setRefreshing(false);
  };

  const handleJoin = async (campaignId: string) => {
    try {
      await joinCampaign(campaignId);
      Alert.alert('Success', 'You have joined the campaign!');
      fetchParticipations();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to join campaign');
    }
  };

  const handleViewCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setShowCampaignDetails(true);
  };

  const handleCloseCampaignDetails = () => {
    setShowCampaignDetails(false);
    setSelectedCampaignId(null);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      targetAudienceAgeGroup: 'all',
      requiredNiche: 'all',
      dateRange: null,
      tenantId: 'all',
    });
  };

  // Filter campaigns based on current filters
  const filterCampaigns = (campaignsToFilter: any[]) => {
    return campaignsToFilter.filter(campaign => {
      // Age group filter
      if (filters.targetAudienceAgeGroup !== 'all' && 
          campaign.targetAudienceAgeGroup !== filters.targetAudienceAgeGroup) {
        return false;
      }

      // Niche filter - case insensitive comparison
      if (filters.requiredNiche !== 'all' && 
          campaign.requiredInfluencerNiche?.toLowerCase() !== filters.requiredNiche.toLowerCase()) {
        return false;
      }

      // Tenant filter
      if (filters.tenantId !== 'all' && 
          campaign.tenantId !== filters.tenantId) {
        return false;
      }

      // Date range filtering (only if both from and to are set)
      if (filters.dateRange && filters.dateRange.from && filters.dateRange.to) {
        const campaignStartDate = new Date(campaign.startDate);
        const campaignEndDate = new Date(campaign.endDate);
        const filterStart = new Date(filters.dateRange.from);
        const filterEnd = new Date(filters.dateRange.to);
        
        // Set both dates to start/end of day for accurate comparison
        campaignStartDate.setHours(0, 0, 0, 0);
        campaignEndDate.setHours(23, 59, 59, 999);
        filterStart.setHours(0, 0, 0, 0);
        filterEnd.setHours(23, 59, 59, 999);
        
        // Only include campaigns that start on/after filterStart AND end on/before filterEnd
        if (campaignStartDate < filterStart || campaignEndDate > filterEnd) {
          return false;
        }
      }

      return true;
    });
  };

  // Partition campaigns
  const joinedIds = participations.filter(p => p.status === 'joined').map(p => p.campaignId);
  const appliedIds = participations.filter(p => p.status === 'applied').map(p => p.campaignId);
  const availableCampaigns = filterCampaigns(campaigns.filter(c => !joinedIds.includes(c.id) && !appliedIds.includes(c.id)));
  const myCampaigns = filterCampaigns(campaigns.filter(c => joinedIds.includes(c.id) || appliedIds.includes(c.id)));

  const renderCampaignCard = (campaign: any, status: 'available' | 'applied' | 'joined') => (
    <View key={campaign.id} style={styles.card}>
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
      {status === 'applied' && (
        <View style={styles.appliedContainer}>
          <Text style={styles.appliedBadge}>Applied (Pending Contract)</Text>
          <Text style={styles.appliedMessage}>Email is sent for contact agreement</Text>
        </View>
      )}
      {status === 'joined' && (
        <Text style={styles.joinedBadge}>Joined</Text>
      )}
      {status === 'available' && (
        <TouchableOpacity style={styles.joinBtn} onPress={() => handleViewCampaign(campaign.id)}>
          <Text style={styles.joinBtnText}>View & Apply</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campaigns</Text>
      </View>
      
      {/* Campaign Filters */}
      <CampaignFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        tenants={tenants}
      />
      
      <View style={styles.tabsRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabBtnText, tab === t.key && styles.tabBtnTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
      {isLoading && !refreshing ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {tab === 'available' && (
            availableCampaigns.length > 0 ? (
              availableCampaigns.map(c => renderCampaignCard(c, 'available'))
            ) : (
              <Text style={styles.emptyText}>
                {filters.targetAudienceAgeGroup !== 'all' || filters.requiredNiche !== 'all' || filters.tenantId !== 'all' || filters.dateRange
                  ? 'No campaigns match your current filters.'
                  : 'No available campaigns.'}
              </Text>
            )
          )}
          {tab === 'my-campaigns' && (
            myCampaigns.length > 0 ? (
              myCampaigns.map(c =>
                renderCampaignCard(
                  c,
                  joinedIds.includes(c.id) ? 'joined' : 'applied'
                )
              )
            ) : (
              <Text style={styles.emptyText}>
                {filters.targetAudienceAgeGroup !== 'all' || filters.requiredNiche !== 'all' || filters.tenantId !== 'all' || filters.dateRange
                  ? 'No campaigns match your current filters.'
                  : 'No joined or applied campaigns.'}
              </Text>
            )
          )}
        </ScrollView>
      )}

      {/* Campaign Details Modal */}
      <Modal
        visible={showCampaignDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseCampaignDetails}
      >
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseCampaignDetails} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Campaign Details</Text>
          </View>
          {selectedCampaignId && (
            <CampaignDetailsScreen 
              campaignId={selectedCampaignId} 
              onClose={handleCloseCampaignDetails} 
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#14b8a6',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#e0f2f1',
    paddingVertical: 8,
    marginBottom: 2,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#e0f2f1',
  },
  tabBtnActive: {
    backgroundColor: '#14b8a6',
  },
  tabBtnText: {
    fontWeight: '600',
    color: '#14b8a6',
  },
  tabBtnTextActive: {
    color: '#fff',
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
  appliedBadge: {
    backgroundColor: '#fef9c3',
    color: '#b45309',
    fontWeight: 'bold',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 13,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  joinedBadge: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    fontWeight: 'bold',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 13,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  joinBtn: {
    marginTop: 12,
    backgroundColor: '#14b8a6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: '#dc2626',
    textAlign: 'center',
    marginVertical: 12,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  modalHeader: {
    padding: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#14b8a6',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginLeft: 10,
  },
  appliedContainer: {
    marginTop: 4,
  },
  appliedMessage: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
}); 