import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, RefreshControl, Modal, TextInput } from 'react-native';
import { useCampaignStore, type Campaign } from '../../../../store/campaign-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import CampaignDetailsScreen from '../../../../components/influencer/CampaignDetails';
import { api } from '../../../../lib/api';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  AnimatedPressCard,
  PremiumOpportunityCard,
  PremiumSegmentedControl,
  PrimaryButton,
  UnderlineTabBar,
} from '@/components/ui';
import { CampaignReferenceCard } from '../../../../components/influencer/CampaignReferenceCard';
import {
  useUgcStore,
  appFromRow,
  canDeliverContent,
  type UgcApplicationRow,
} from '@/store/ugc-store';
import {
  campaignAvailableLabel,
  campaignAvailableTone,
  campaignParticipationLabel,
  campaignParticipationTone,
  labelForContentType,
  platformForContentType,
  ugcApplicationShort,
  ugcApplicationTone,
  ugcJobTone,
} from '@/lib/opportunity-card-ui';
import { appShell, palette, radius, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';
import { Ionicons } from '@expo/vector-icons';
import {
  CampaignSwipeFeed,
  type SwipeFeedRenderOptions,
} from '../../../../components/influencer/CampaignSwipeFeed';
import type { OpportunityStatusTone } from '@/lib/opportunity-card-ui';
const MAIN_TABS = [
  { key: 'available', label: 'Partnership', icon: 'layers-outline' as const },
  { key: 'my-partnerships', label: 'Mine', icon: 'folder-outline' as const },
  { key: 'public', label: 'Public', icon: 'globe-outline' as const },
];

const TAB_HEADERS: Record<string, { title: string; subtitle: string }> = {
  available: {
    title: 'Partnership Campaigns',
    subtitle: 'Browse collaborations and public briefs',
  },
  'my-partnerships': {
    title: 'My Campaigns',
    subtitle: 'Track applications and active partnerships',
  },
  public: {
    title: 'Public Campaigns',
    subtitle: 'UGC briefs and applications',
  },
};

const PUBLIC_SEGMENTS = [
  { key: 'jobs', label: 'Browse' },
  { key: 'applications', label: 'My applications' },
];

function formatUgcDeadline(raw: unknown): string | null {
  if (!raw) return null;
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const NICHE_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'fashion', label: 'Fashion' },
  { key: 'beauty', label: 'Beauty' },
  { key: 'technology', label: 'Tech' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'lifestyle', label: 'Lifestyle' },
];

const DB_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TenantOption = {
  id: string;
  tenantName: string;
  domain: string;
  subdomain: string;
  status: string;
};

function normStatus(s: unknown) {
  return String(s ?? '').trim().toLowerCase();
}

function findParticipationForCampaign(
  list: {
    id?: string;
    campaignId?: string;
    status?: string;
    inviteId?: string | null;
    campaign?: { id?: string } | null;
  }[] | undefined,
  campaignId: string
) {
  if (!Array.isArray(list)) return undefined;
  const cid = String(campaignId ?? '').trim().toLowerCase();
  return list.find((p) => {
    if (!p) return false;
    const pid = String(p.campaignId ?? '').trim().toLowerCase();
    const nested = String(p.campaign?.id ?? '').trim().toLowerCase();
    return pid === cid || nested === cid;
  });
}

function applicationForCampaign(
  apps:
    | {
        campaignId?: string;
        campaign?: { id?: string };
        status?: string;
      }[]
    | undefined,
  campaignId: string
) {
  if (!Array.isArray(apps)) return undefined;
  const cid = String(campaignId ?? '').trim().toLowerCase();
  return apps.find((a) => {
    if (!a) return false;
    const aid = String(a.campaignId ?? '').trim().toLowerCase();
    const nested = String(a.campaign?.id ?? '').trim().toLowerCase();
    return aid === cid || nested === cid;
  });
}

function canNavigateToContractForCampaign(
  participations: Parameters<typeof findParticipationForCampaign>[0],
  apps: Parameters<typeof applicationForCampaign>[0],
  campaignId: string
): boolean {
  const p = findParticipationForCampaign(participations, campaignId);
  if (!p?.id) return false;
  const inviteBacked = p.inviteId != null && String(p.inviteId).trim() !== '';
  const app = applicationForCampaign(apps, campaignId);
  const appSt = normStatus(app?.status);
  const approvedApp = ['approved', 'contract_pending', 'contract_signed'].includes(appSt);
  const legacyNoApp = !app;
  return inviteBacked || approvedApp || legacyNoApp;
}

function isAwaitingBrandApprovalOnly(
  apps: Parameters<typeof applicationForCampaign>[0],
  participations: Parameters<typeof findParticipationForCampaign>[0],
  campaignId: string
): boolean {
  const app = applicationForCampaign(apps, campaignId);
  const appSt = normStatus(app?.status);
  if (!['applied', 'pending_review'].includes(appSt)) return false;
  return !findParticipationForCampaign(participations, campaignId);
}
const SHORT_MONTH_DAY = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

function formatCampaignDurationRange(startDate?: string, endDate?: string) {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const startValid = !!start && !Number.isNaN(start.getTime());
  const endValid = !!end && !Number.isNaN(end.getTime());

  if (startValid && endValid) {
    return `${SHORT_MONTH_DAY.format(start)} – ${SHORT_MONTH_DAY.format(end)}`;
  }
  if (startValid) {
    return `Starts ${SHORT_MONTH_DAY.format(start)}`;
  }
  return 'TBD';
}

function formatCommissionRate(rate: unknown): string {
  const n = Number(rate);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(2)}%`;
}

function buildCampaignMetaLine(campaign: Campaign): string {
  const niche = campaign.requiredInfluencerNiche
    ? String(campaign.requiredInfluencerNiche).replace(/_/g, ' ')
    : 'General';
  const audience = campaign.targetAudienceAgeGroup
    ? String(campaign.targetAudienceAgeGroup).replace(/_/g, ' ')
    : 'All ages';
  const nicheLabel = niche.charAt(0).toUpperCase() + niche.slice(1);
  return `${nicheLabel} • ${audience}`;
}

function buildCampaignReferenceFooter(
  campaign: Campaign,
  status: 'available' | 'applied' | 'joined',
  applications: Parameters<typeof applicationForCampaign>[0],
  participations: Parameters<typeof findParticipationForCampaign>[0],
  handlers: {
    handleViewCampaign: (id: string) => void;
    router: ReturnType<typeof useRouter>;
  }
): { badge: string | null; buttonLabel: string; onPress: () => void } {
  const cid = String(campaign.id);

  if (status === 'joined') {
    return {
      badge: 'ACTIVE',
      buttonLabel: 'Track Progress',
      onPress: () => {
        try {
          const participation = findParticipationForCampaign(participations, cid);
          const st = normStatus(participation?.status);
          const participationOk = participation && ['active', 'completed'].includes(st);
          if (participationOk) {
            handlers.router.push({
              pathname: '/influencer/campaign-progress',
              params: { participationId: String(participation.id), campaignId: cid },
            });
          }
        } catch (error) {
          console.error('Error navigating to progress:', error);
        }
      },
    };
  }

  if (status === 'applied') {
    const appRow = applicationForCampaign(applications, cid);
    const appSt = normStatus(appRow?.status);
    const awaitingOnly = isAwaitingBrandApprovalOnly(applications, participations, cid);
    const canContract = canNavigateToContractForCampaign(participations, applications, cid);

    if (appSt === 'rejected') {
      return {
        badge: 'NOT APPROVED',
        buttonLabel: 'View details',
        onPress: () => handlers.handleViewCampaign(cid),
      };
    }
    if (awaitingOnly) {
      return {
        badge: 'APPLICATION SENT',
        buttonLabel: 'View details',
        onPress: () => handlers.handleViewCampaign(cid),
      };
    }
    if (canContract) {
      return {
        badge: 'READY TO SIGN',
        buttonLabel: 'View & Sign Contract',
        onPress: () => {
          try {
            const participation = findParticipationForCampaign(participations, cid);
            const st = normStatus(participation?.status);
            const participationOk =
              participation && ['invited', 'accepted', 'contract_pending'].includes(st);
            if (participationOk && DB_ID_REGEX.test(String(participation.id))) {
              handlers.router.push({
                pathname: '/influencer/contract',
                params: { participationId: participation.id },
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
        },
      };
    }
    return {
      badge: 'AWAITING APPROVAL',
      buttonLabel: 'View details',
      onPress: () => handlers.handleViewCampaign(cid),
    };
  }

  const campaignStatus = String(campaign.status || 'active').trim().toLowerCase();
  return {
    badge: campaignStatus === 'active' ? 'OPEN' : campaignAvailableLabel(String(campaign.status || 'active')).toUpperCase(),
    buttonLabel: 'View & Apply',
    onPress: () => handlers.handleViewCampaign(cid),
  };
}


export default function InfluencerCampaignsScreen() {
  const {
    campaigns,
    participations,
    applications,
    isLoading,
    error,
    fetchCampaigns,
    fetchParticipations,
    fetchMyApplications,
  } = useCampaignStore();
  const params = useLocalSearchParams<{ segment?: string }>();
  const [tab, setTab] = useState('available');
  const headerCopy = TAB_HEADERS[tab] ?? TAB_HEADERS.available;
  const {
    segment: ugcSegment,
    setSegment: setUgcSegment,
    jobs: ugcJobs,
    applications: ugcApplications,
    loading: ugcLoading,
    error: ugcError,
    fetchJobs,
    fetchApplications,
  } = useUgcStore();

  useEffect(() => {
    if (params.segment === 'public') setTab('public');
  }, [params.segment]);

  useFocusEffect(
    useCallback(() => {
      if (tab !== 'public') return;
      if (ugcSegment === 'jobs') void fetchJobs();
      else void fetchApplications();
    }, [tab, ugcSegment, fetchJobs, fetchApplications])
  );
  const [refreshing, setRefreshing] = useState(false);
  const [feedHeight, setFeedHeight] = useState(0);
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
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const router = useRouter();

  const openUgcDeliver = (appId: string, title: string) => {
    router.push(
      `/influencer/ugc-deliver?applicationId=${encodeURIComponent(appId)}&title=${encodeURIComponent(title)}` as never
    );
  };

  const onUgcApplicationPress = (row: UgcApplicationRow) => {
    const app = appFromRow(row);
    const brief = row.brief ?? {};
    const briefId = String(brief.id ?? '');
    const title = String(brief.title ?? 'UGC Brief');

    if (canDeliverContent(row) && app.id) {
      openUgcDeliver(app.id, title);
      return;
    }
    if (briefId) {
      router.push(`/influencer/ugc-brief-detail?id=${briefId}` as never);
    }
  };

  const ugcList = ugcSegment === 'jobs' ? ugcJobs : ugcApplications;

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchCampaigns();
        await fetchParticipations();
        await fetchMyApplications();
        await fetchTenants();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [fetchCampaigns, fetchParticipations, fetchMyApplications]);

  const fetchTenants = async () => {
    try {
      const response = (await api.get('/api/tenants')) as unknown;
      if (response && Array.isArray(response)) {
        setTenants(response as TenantOption[]);
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
      await fetchMyApplications();
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

  const handleApplySuccess = (participation: { id?: string | null } | null) => {
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
  const filterCampaigns = (campaignsToFilter: Campaign[]) => {
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
          const campaignEndDate = new Date(campaign.endDate ?? campaign.startDate);
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

  const activeStatuses = new Set(['active', 'completed']);
  const pendingStatuses = new Set(['invited', 'accepted', 'contract_pending']);
  const joinedIds = Array.isArray(participations)
    ? participations
        .filter((p) => p && activeStatuses.has(normStatus(p.status)))
        .map((p) => p.campaignId)
    : [];
  const appliedIds = Array.isArray(participations)
    ? participations
        .filter((p) => p && pendingStatuses.has(normStatus(p.status)))
        .map((p) => p.campaignId)
    : [];
  const appliedCampaignIds = Array.isArray(applications)
    ? applications
        .filter(
          (a) =>
            a &&
            ['applied', 'pending_review', 'approved', 'contract_pending', 'contract_signed', 'rejected'].includes(
              normStatus(a.status)
            )
        )
        .map((a) => String(a.campaignId ?? a.campaign?.id ?? ''))
        .filter(Boolean)
    : [];
  const unavailableIds = new Set([...joinedIds, ...appliedIds, ...appliedCampaignIds]);
  const availableCampaigns = filterCampaigns(
    Array.isArray(campaigns) ? campaigns.filter((c) => c && !unavailableIds.has(c.id)) : []
  );
  const myCampaignIds = new Set([...joinedIds, ...appliedIds, ...appliedCampaignIds]);
  const myCampaigns = filterCampaigns(
    Array.isArray(campaigns) ? campaigns.filter((c) => c && myCampaignIds.has(c.id)) : []
  );

  const hasAdvancedFilters = useMemo(() => {
    return (
      filters.targetAudienceAgeGroup !== 'all' ||
      filters.tenantId !== 'all' ||
      !!filters.dateRange
    );
  }, [filters.targetAudienceAgeGroup, filters.tenantId, filters.dateRange]);

  const renderCampaignCard = (
    campaign: Campaign,
    status: 'available' | 'applied' | 'joined',
    _options?: SwipeFeedRenderOptions
  ) => {
    if (!campaign) return null;

    try {
      const cid = String(campaign.id);
      const footer = buildCampaignReferenceFooter(campaign, status, applications, participations, {
        handleViewCampaign,
        router,
      });
      const statusLabel =
        status === 'available'
          ? campaignAvailableLabel(String(campaign.status || 'active'))
          : campaignParticipationLabel(
              status,
              normStatus(applicationForCampaign(applications, cid)?.status)
            );
      const statusTone: OpportunityStatusTone =
        status === 'available'
          ? campaignAvailableTone(String(campaign.status || 'active'))
          : campaignParticipationTone(status);

      const niche = campaign.requiredInfluencerNiche
        ? String(campaign.requiredInfluencerNiche).replace(/_/g, ' ')
        : 'General';
      const audience = campaign.targetAudienceAgeGroup
        ? String(campaign.targetAudienceAgeGroup).replace(/_/g, ' ')
        : 'All ages';

      return (
        <CampaignReferenceCard
          style={styles.campaignCard}
          title={String(campaign.name || 'Untitled Campaign')}
          brandName={String(campaign.tenant?.tenantName || 'Unknown brand')}
          metaLine={buildCampaignMetaLine(campaign)}
          statusLabel={statusLabel}
          statusTone={statusTone}
          commissionRate={formatCommissionRate(campaign.commissionRate)}
          duration={formatCampaignDurationRange(campaign.startDate, campaign.endDate ?? undefined)}
          niche={niche.charAt(0).toUpperCase() + niche.slice(1)}
          audience={audience}
          footerBadge={footer.badge}
          footerButtonLabel={footer.buttonLabel}
          onFooterPress={footer.onPress}
          onPress={() => handleViewCampaign(cid)}
        />
      );
    } catch (error) {
      console.error('Error rendering campaign card:', error);
      return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: appShell.canvas }}>
      <View style={styles.topChrome}>
        <View style={styles.tabsRow}>
          <UnderlineTabBar tabs={MAIN_TABS} value={tab} onChange={(key) => setTab(key)} />
        </View>

        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>{headerCopy.title}</Text>
              <Text style={styles.headerSubTitle}>{headerCopy.subtitle}</Text>
            </View>
            {tab !== 'public' ? (
              <TouchableOpacity
                style={[styles.filterIconBtn, hasAdvancedFilters && styles.filterIconBtnActive]}
                onPress={() => setShowAdvancedFilters(true)}
              >
                <Ionicons name="options-outline" size={18} color={hasAdvancedFilters ? palette.white : appShell.cta} />
              </TouchableOpacity>
            ) : null}
          </View>

          {tab !== 'public' ? (
            <>
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
            </>
          ) : null}
        </View>
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
      {isLoading && !refreshing && tab !== 'public' ? (
        <ActivityIndicator size="large" color={appShell.cta} style={{ marginTop: 40 }} />
      ) : (
        <View
          style={styles.feedShell}
          onLayout={(event) => {
            const next = Math.round(event.nativeEvent.layout.height);
            if (next > 0 && next !== feedHeight) setFeedHeight(next);
          }}
        >
          {tab === 'available' && (
            availableCampaigns.length > 0 ? (
              <CampaignSwipeFeed
                data={availableCampaigns}
                itemHeight={feedHeight}
                keyExtractor={(c) => String(c.id)}
                renderItem={(c, _i, opts) => renderCampaignCard(c, 'available', opts)}
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            ) : (
              <View style={styles.emptyFeed}>
                <Text style={styles.emptyText}>
                  {filters.targetAudienceAgeGroup !== 'all' || filters.requiredNiche !== 'all' || filters.tenantId !== 'all' || filters.dateRange
                    ? 'No campaigns match your current filters.'
                    : 'No available campaigns.'}
                </Text>
              </View>
            )
          )}
          {tab === 'my-partnerships' && (
            myCampaigns.length > 0 ? (
              <CampaignSwipeFeed
                data={myCampaigns}
                itemHeight={feedHeight}
                keyExtractor={(c) => String(c.id)}
                renderItem={(c, _i, opts) =>
                  renderCampaignCard(
                    c,
                    joinedIds.includes(String(c.id)) ? 'joined' : 'applied',
                    opts
                  )
                }
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            ) : (
              <View style={styles.emptyFeed}>
                <Text style={styles.emptyText}>
                  {filters.targetAudienceAgeGroup !== 'all' || filters.requiredNiche !== 'all' || filters.tenantId !== 'all' || filters.dateRange
                    ? 'No campaigns match your current filters.'
                    : 'No joined or applied campaigns.'}
                </Text>
              </View>
            )
          )}
          {tab === 'public' && (
            <ScrollView
              contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.lg }}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
            <>
              <PremiumSegmentedControl
                segments={PUBLIC_SEGMENTS}
                value={ugcSegment}
                onChange={(key) => setUgcSegment(key as 'jobs' | 'applications')}
                compact
                style={{ marginBottom: spacing.sm }}
              />
              {ugcLoading ? (
                <ActivityIndicator color={appShell.cta} style={{ marginTop: spacing.lg }} />
              ) : ugcError ? (
                <View style={styles.ugcEmptyBlock}>
                  <Text style={styles.ugcError}>{ugcError}</Text>
                  <TouchableOpacity
                    style={styles.ugcRetryBtn}
                    onPress={() => void (ugcSegment === 'jobs' ? fetchJobs() : fetchApplications())}
                  >
                    <Text style={styles.ugcRetryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : ugcList.length === 0 ? (
                <Text style={styles.emptyText}>
                  {ugcSegment === 'jobs'
                    ? 'No open public briefs right now. Check back when a brand posts a new brief.'
                    : 'No applications yet. Browse public briefs and apply.'}
                </Text>
              ) : (
                ugcList.map((item, idx) => {
                  if (ugcSegment === 'jobs') {
                    const brief = item as Record<string, unknown>;
                    const id = String(brief.id ?? idx);
                    const title = String(brief.title ?? 'UGC Brief');
                    const budget = Number(brief.budgetPerPiece ?? 0);
                    const hasApplied = Boolean(brief.hasApplied);
                    const productName = String(brief.productName ?? 'Brand brief');
                    const contentType = String(brief.contentType ?? 'ugc_video');
                    const deadline = formatUgcDeadline(brief.deadline);
                    const piecesNeeded = Number(brief.piecesNeeded ?? 0);
                    const piecesFilled = Number(brief.piecesFilled ?? 0);
                    const subtitleParts = [
                      productName,
                      labelForContentType(contentType),
                      deadline ? `Due ${deadline}` : null,
                    ].filter(Boolean);
                    const slotsLine =
                      piecesNeeded > 0
                        ? `${Math.max(0, piecesNeeded - piecesFilled)} of ${piecesNeeded} slots open`
                        : undefined;

                    return (
                      <AnimatedPressCard
                        key={id}
                        style={styles.campaignCard}
                        onPress={() => router.push(`/influencer/ugc-brief-detail?id=${id}` as never)}
                      >
                        <PremiumOpportunityCard
                          title={title}
                          subtitle={subtitleParts.join(' · ')}
                          platform={platformForContentType(contentType)}
                          statusLabel={hasApplied ? 'Applied' : 'Open'}
                          statusTone={ugcJobTone(hasApplied)}
                          amountPrimary={`₹${budget.toLocaleString('en-IN')}`}
                          amountSecondary="/ piece"
                          quote={slotsLine}
                          quoteLabel={slotsLine ? 'Availability' : undefined}
                          onPress={undefined}
                          showChevron={false}
                        />
                      </AnimatedPressCard>
                    );
                  }

                  const row = item as UgcApplicationRow;
                  const app = appFromRow(row);
                  const brief = row.brief ?? {};
                  const title = String(brief.title ?? 'UGC Brief');
                  const budget = Number(brief.budgetPerPiece ?? 0);
                  const productName = String(brief.productName ?? 'Brand brief');
                  const contentType = String(brief.contentType ?? 'ugc_video');
                  const showDeliver = canDeliverContent(row) && Boolean(app.id);

                  const footer = showDeliver ? (
                    <TouchableOpacity
                      style={styles.ugcDeliverBtn}
                      onPress={() => openUgcDeliver(app.id, title)}
                    >
                      <Text style={styles.ugcDeliverBtnText}>Deliver content</Text>
                    </TouchableOpacity>
                  ) : undefined;

                  return (
                    <AnimatedPressCard
                      key={app.id || String(brief.id ?? idx)}
                      style={styles.campaignCard}
                      onPress={() => onUgcApplicationPress(row)}
                    >
                      <PremiumOpportunityCard
                        title={title}
                        subtitle={`${productName} · ${labelForContentType(contentType)}`}
                        platform={platformForContentType(contentType)}
                        statusLabel={ugcApplicationShort(row)}
                        statusTone={ugcApplicationTone(row)}
                        amountPrimary={`₹${budget.toLocaleString('en-IN')}`}
                        amountSecondary="/ piece"
                        showChevron={!showDeliver}
                        onPress={undefined}
                        footer={footer}
                      />
                    </AnimatedPressCard>
                  );
                })
              )}
            </>
            </ScrollView>
          )}
        </View>
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
              <Text style={styles.closeButtonText}>âœ•</Text>
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
  topChrome: {
    backgroundColor: appShell.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: appShell.borderSubtle,
    zIndex: 2,
    gap: spacing.xs,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: appShell.canvas,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerTitles: {
    flex: 1,
    minWidth: 0,
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 0,
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
  feedShell: {
    flex: 1,
  },
  emptyFeed: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  campaignCard: {
    marginBottom: 0,
    width: '100%',
  },
  partnershipCampaignCard: {
    alignSelf: 'center',
    width: '100%',
  },
  ugcEmptyBlock: { marginTop: spacing.md, gap: spacing.sm },
  ugcError: { color: '#b45309', fontFamily: fonts.semiBold },
  ugcRetryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: appShell.cta,
  },
  ugcRetryText: { color: appShell.cta, fontFamily: fonts.semiBold },
  ugcDeliverBtn: {
    backgroundColor: appShell.cta,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  ugcDeliverBtnText: { color: palette.white, fontFamily: fonts.semiBold },
}); 

