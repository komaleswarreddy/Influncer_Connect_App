import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, RefreshControl, Modal, TextInput } from 'react-native';
import { useCampaignStore } from '../../../../store/campaign-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import CampaignDetailsScreen from '../../../../components/influencer/CampaignDetails';
import { api } from '../../../../lib/api';
import { useRouter } from 'expo-router';
import { PremiumCampaignFeedCard, PrimaryButton, type FeedMetaRow } from '@/components/ui';
import { appShell, palette, radius, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';
import { Ionicons } from '@expo/vector-icons';

const TABS = [
  { key: 'available', label: 'Available Campaigns' },
  { key: 'my-campaigns', label: 'My Campaigns' },
];

const NICHE_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'fashion', label: 'Fashion' },
  { key: 'beauty', label: 'Beauty' },
  { key: 'technology', label: 'Tech' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'lifestyle', label: 'Lifestyle' },
];

const DB_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHORT_MONTH_DAY = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

export default function InfluencerCampaignsScreen() {
  const {
    campaigns,
    participations,
    isLoading,
    error,
    fetchCampaigns,
    fetchParticipations,
  } = useCampaignStore();
  const [tab, setTab] = useState('available');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchCampaigns();
        await fetchParticipations();
        await fetchTenants();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await api.get('/api/tenants');
      if (response && Array.isArray(response)) {
        setTenants(response);
      } else {
        // Use mock tenants if API fails
        setTenants([
          { id: 'tenant-1', tenantName: 'Fashion Forward', domain: 'fashionforward.com', subdomain: 'fashion', status: 'active' },
          { id: 'tenant-2', tenantName: 'TechZone', domain: 'techzone.com', subdomain: 'tech', status: 'active' },
          { id: 'tenant-3', tenantName: 'FitLife', domain: 'fitlife.com', subdomain: 'fitness', status: 'active' },
          { id: 'tenant-4', tenantName: 'HomeStyle', domain: 'homestyle.com', subdomain: 'home', status: 'active' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      // Use mock tenants as fallback
      setTenants([
        { id: 'tenant-1', tenantName: 'Fashion Forward', domain: 'fashionforward.com', subdomain: 'fashion', status: 'active' },
        { id: 'tenant-2', tenantName: 'TechZone', domain: 'techzone.com', subdomain: 'tech', status: 'active' },
        { id: 'tenant-3', tenantName: 'FitLife', domain: 'fitlife.com', subdomain: 'fitness', status: 'active' },
        { id: 'tenant-4', tenantName: 'HomeStyle', domain: 'homestyle.com', subdomain: 'home', status: 'active' }
      ]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCampaigns();
      await fetchParticipations();
      await fetchTenants();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewCampaign = (campaignId: string) => {
    try {
      setSelectedCampaignId(campaignId);
      setShowCampaignDetails(true);
    } catch (error) {
      console.error('Error viewing campaign:', error);
      Alert.alert('Error', 'Failed to load campaign details');
    }
  };

  const handleCloseCampaignDetails = () => {
    setShowCampaignDetails(false);
    setSelectedCampaignId(null);
  };

  const handleApplySuccess = (participation: any) => {
    try {
      // Close the modal first
      setShowCampaignDetails(false);
      setSelectedCampaignId(null);
      
      // Navigate directly only when participation has a real DB UUID id.
      if (participation && participation.id && DB_ID_REGEX.test(String(participation.id))) {
        setTimeout(() => {
          try {
            // Try href approach first
            router.push(`/influencer/contract?participationId=${participation.id}`);
          } catch (error) {
            console.error('Navigation error:', error);
            // Fallback to pathname/params approach
            try {
              router.replace({
                pathname: '/influencer/contract',
                params: { participationId: participation.id }
              });
            } catch (fallbackError) {
              console.error('Fallback navigation error:', fallbackError);
            }
          }
        }, 100); // Small delay to ensure modal is closed
      } else {
        // Mock/local IDs like part-* should not call contract endpoint.
        Alert.alert(
          'Campaign Applied Successfully!',
          'You have applied for the campaign. Contract will be available once your participation syncs.',
          [
            {
              text: 'OK',
              onPress: () => {
                fetchParticipations();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error handling apply success:', error);
    }
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

  const handleNicheChipPress = (niche: string) => {
    setFilters(prev => ({
      ...prev,
      requiredNiche: prev.requiredNiche === niche ? 'all' : niche,
    }));
  };

  // Filter campaigns based on current filters + search
  const filterCampaigns = (campaignsToFilter: any[]) => {
    if (!Array.isArray(campaignsToFilter)) {
      return [];
    }
    
    return campaignsToFilter.filter(campaign => {
      if (!campaign) return false;
      
      try {
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
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.trim().toLowerCase();
          const name = String(campaign.name || '').toLowerCase();
          const brand = String(campaign.tenant?.tenantName || '').toLowerCase();
          const niche = String(campaign.requiredInfluencerNiche || '').toLowerCase();
          if (!name.includes(q) && !brand.includes(q) && !niche.includes(q)) {
            return false;
          }
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
          campaignStartDate.setHours(0, 0, 0, 0);
          campaignEndDate.setHours(23, 59, 59, 999);
          filterStart.setHours(0, 0, 0, 0);
          filterEnd.setHours(23, 59, 59, 999);
          if (campaignStartDate < filterStart || campaignEndDate > filterEnd) {
            return false;
          }
        }
        return true;
      } catch (error) {
        console.error('Error filtering campaign:', error);
        return false;
      }
    });
  };

  // Partition campaigns safely
  const joinedIds = Array.isArray(participations) ? participations.filter(p => p && p.status === 'joined').map(p => p.campaignId) : [];
  const appliedIds = Array.isArray(participations) ? participations.filter(p => p && p.status === 'applied').map(p => p.campaignId) : [];
  const availableCampaigns = filterCampaigns(Array.isArray(campaigns) ? campaigns.filter(c => c && !joinedIds.includes(c.id) && !appliedIds.includes(c.id)) : []);
  const myCampaigns = filterCampaigns(Array.isArray(campaigns) ? campaigns.filter(c => c && (joinedIds.includes(c.id) || appliedIds.includes(c.id))) : []);

  const hasAdvancedFilters = useMemo(() => {
    return (
      filters.targetAudienceAgeGroup !== 'all' ||
      filters.tenantId !== 'all' ||
      !!filters.dateRange
    );
  }, [filters.targetAudienceAgeGroup, filters.tenantId, filters.dateRange]);

  const renderCampaignCard = (campaign: any, status: 'available' | 'applied' | 'joined') => {
    if (!campaign) return null;
    
    try {
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
        { label: 'Brand', value: String(campaign.tenant?.tenantName || 'Unknown') },
        { label: 'Commission', value: campaign.commissionRate != null ? `${campaign.commissionRate}%` : 'N/A' },
        {
          label: 'Duration',
          value: formatDurationRange(campaign.startDate, campaign.endDate),
        },
      ];

      let footer: React.ReactNode = null;
      if (status === 'applied') {
        footer = (
          <>
            <Text style={styles.appliedBadge}>Applied (Pending Contract)</Text>
            <Text style={styles.appliedMessage}>Please review and sign the contract</Text>
            <PrimaryButton
              compact
              label="View & Sign Contract"
              onPress={() => {
                try {
                  const participation = Array.isArray(participations) ? participations.find(p => p && p.campaignId === campaign.id && p.status === 'applied') : null;
                  if (participation && DB_ID_REGEX.test(String(participation.id))) {
                    router.push({
                      pathname: '/influencer/contract',
                      params: { participationId: participation.id }
                    });
                  } else {
                    Alert.alert(
                      'Contract Not Ready',
                      'Your participation is pending sync. Please refresh and try again shortly.'
                    );
                  }
                } catch (error) {
                  console.error('Error navigating to contract:', error);
                }
              }}
            />
          </>
        );
      } else if (status === 'joined') {
        footer = (
          <PrimaryButton
            compact
            label="Track Progress"
            onPress={() => {
              try {
                const participation = Array.isArray(participations) ? participations.find(p => p && p.campaignId === campaign.id && p.status === 'joined') : null;
                if (participation) {
                  router.push({
                    pathname: '/influencer/campaign-progress',
                    params: { participationId: participation.id, campaignId: campaign.id }
                  });
                }
              } catch (error) {
                console.error('Error navigating to progress:', error);
              }
            }}
          />
        );
      } else {
        footer = <PrimaryButton compact label="View & Apply" onPress={() => handleViewCampaign(campaign.id)} />;
      }

      return (
        <PremiumCampaignFeedCard
          key={campaign.id}
          style={[
            styles.campaignCard,
            status === 'available' && styles.availableCampaignCard,
          ]}
          overline={String(campaign.type || 'Campaign').replace('_', ' ')}
          title={campaign.name || 'Untitled Campaign'}
          statusLabel={String(campaign.status || 'Unknown').toUpperCase()}
          description={undefined}
          metaRows={metaRows}
          metaLayout="columns"
          footer={footer}
        />
      );
    } catch (error) {
      console.error('Error rendering campaign card:', error);
      return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: appShell.canvas }}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Campaigns</Text>
            <Text style={styles.headerSubTitle}>Find premium partnerships for your niche</Text>
          </View>
          <TouchableOpacity
            style={[styles.filterIconBtn, hasAdvancedFilters && styles.filterIconBtnActive]}
            onPress={() => setShowAdvancedFilters(true)}
          >
            <Ionicons name="options-outline" size={18} color={hasAdvancedFilters ? palette.white : appShell.cta} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={appShell.textMuted} />
          <TextInput
            placeholder="Search brands..."
            placeholderTextColor={appShell.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nicheRow}>
          {NICHE_CHIPS.map(chip => {
            const active = filters.requiredNiche === chip.key || (chip.key === 'all' && filters.requiredNiche === 'all');
            return (
              <TouchableOpacity
                key={chip.key}
                style={[styles.nicheChip, active && styles.nicheChipActive]}
                onPress={() => handleNicheChipPress(chip.key)}
              >
                <Text style={[styles.nicheChipText, active && styles.nicheChipTextActive]}>{chip.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
        <ActivityIndicator size="large" color={appShell.cta} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.lg }}
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
      <Modal
        visible={showAdvancedFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAdvancedFilters(false)}
      >
        <View style={styles.filtersModalOverlay}>
          <View style={styles.filtersModalCard}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Advanced Filters</Text>
              <TouchableOpacity onPress={() => setShowAdvancedFilters(false)}>
                <Ionicons name="close" size={22} color={appShell.cta} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Audience Age Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inlineFilterRow}>
              {['all', '13-17', '18-24', '25-34', '35-44', '45+'].map(age => {
                const active = filters.targetAudienceAgeGroup === age;
                return (
                  <TouchableOpacity
                    key={age}
                    style={[styles.inlineFilterChip, active && styles.inlineFilterChipActive]}
                    onPress={() => handleFilterChange({ ...filters, targetAudienceAgeGroup: age })}
                  >
                    <Text style={[styles.inlineFilterText, active && styles.inlineFilterTextActive]}>{age === 'all' ? 'All Ages' : age}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.filterLabel}>Brand</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inlineFilterRow}>
              <TouchableOpacity
                style={[styles.inlineFilterChip, filters.tenantId === 'all' && styles.inlineFilterChipActive]}
                onPress={() => handleFilterChange({ ...filters, tenantId: 'all' })}
              >
                <Text style={[styles.inlineFilterText, filters.tenantId === 'all' && styles.inlineFilterTextActive]}>All Brands</Text>
              </TouchableOpacity>
              {tenants.map(tenant => {
                const active = filters.tenantId === tenant.id;
                return (
                  <TouchableOpacity
                    key={tenant.id}
                    style={[styles.inlineFilterChip, active && styles.inlineFilterChipActive]}
                    onPress={() => handleFilterChange({ ...filters, tenantId: tenant.id })}
                  >
                    <Text style={[styles.inlineFilterText, active && styles.inlineFilterTextActive]}>{tenant.tenantName}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.filtersActionRow}>
              <TouchableOpacity style={styles.resetFiltersBtn} onPress={handleResetFilters}>
                <Text style={styles.resetFiltersText}>Reset</Text>
              </TouchableOpacity>
              <PrimaryButton compact label="Apply" onPress={() => setShowAdvancedFilters(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCampaignDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseCampaignDetails}
      >
        <View style={{ flex: 1, backgroundColor: appShell.canvas }}>
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
              onApplySuccess={handleApplySuccess}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: appShell.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.borderSubtle,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: appShell.cta,
  },
  headerSubTitle: {
    marginTop: 2,
    fontSize: 12,
    color: appShell.textSecondary,
    fontFamily: fonts.regular,
  },
  filterIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: appShell.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appShell.canvasAlt,
  },
  filterIconBtnActive: {
    backgroundColor: appShell.cta,
    borderColor: appShell.cta,
  },
  searchWrap: {
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: appShell.canvasAlt,
    borderWidth: 1,
    borderColor: appShell.cardBorder,
    paddingHorizontal: 14,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: appShell.textPrimary,
    fontFamily: fonts.regular,
  },
  nicheRow: {
    paddingTop: spacing.sm,
    gap: 8,
  },
  nicheChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: appShell.canvasAlt,
    borderWidth: 1,
    borderColor: appShell.cardBorder,
  },
  nicheChipActive: {
    backgroundColor: appShell.cta,
    borderColor: appShell.cta,
  },
  nicheChipText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: appShell.cta,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  nicheChipTextActive: {
    color: palette.white,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: appShell.canvas,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: appShell.canvasAlt,
    borderWidth: 1,
    borderColor: appShell.cardBorder,
  },
  tabBtnActive: {
    backgroundColor: appShell.cta,
    borderColor: appShell.cta,
  },
  tabBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: appShell.cta,
  },
  tabBtnTextActive: {
    color: palette.white,
  },
  appliedBadge: {
    backgroundColor: appShell.iceBlue,
    color: appShell.textPrimary,
    fontFamily: fonts.semiBold,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  error: {
    color: palette.error,
    textAlign: 'center',
    marginVertical: 12,
  },
  emptyText: {
    color: appShell.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
  modalHeader: {
    padding: spacing.md,
    backgroundColor: appShell.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: appShell.cta,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: appShell.cta,
    marginLeft: 10,
  },
  appliedMessage: {
    color: appShell.textSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  filtersModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 17, 40, 0.4)',
  },
  filtersModalCard: {
    backgroundColor: appShell.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filtersTitle: {
    fontFamily: fonts.bold,
    color: appShell.textPrimary,
    fontSize: 16,
  },
  filterLabel: {
    marginTop: spacing.xs,
    color: appShell.textSecondary,
    fontSize: 12,
    fontFamily: fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  inlineFilterRow: {
    gap: 8,
    paddingVertical: spacing.xs,
  },
  inlineFilterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: appShell.canvasAlt,
    borderWidth: 1,
    borderColor: appShell.cardBorder,
  },
  inlineFilterChipActive: {
    backgroundColor: appShell.cta,
    borderColor: appShell.cta,
  },
  inlineFilterText: {
    color: appShell.textPrimary,
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  inlineFilterTextActive: {
    color: palette.white,
  },
  filtersActionRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  resetFiltersBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: appShell.canvasAlt,
    borderWidth: 1,
    borderColor: appShell.cardBorder,
  },
  resetFiltersText: {
    color: appShell.textSecondary,
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  campaignCard: {
    marginBottom: spacing.md,
  },
  availableCampaignCard: {
    alignSelf: 'center',
    width: '94%',
    minHeight: 332,
  },
}); 