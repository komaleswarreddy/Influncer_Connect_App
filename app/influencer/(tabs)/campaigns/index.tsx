import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  Modal,
  FlatList,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useCampaignStore, type Campaign } from '../../../../store/campaign-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import CampaignDetailsScreen from '../../../../components/influencer/CampaignDetails';
import { api } from '../../../../lib/api';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { PremiumSegmentedControl, PrimaryButton, UnderlineTabBar } from '@/components/ui';
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
  buildMineCampaignStatus,
  labelForContentType,
  ugcJobTone,
} from '@/lib/opportunity-card-ui';
import { appShell, palette, radius, spacing } from '@/theme';
import { useAppShell } from '@/theme/useAppShell';
import { fonts } from '@/components/ui/typography';
import { resolveCampaignPaySummary } from '@/lib/campaign-pay-summary';
import { Ionicons } from '@expo/vector-icons';
import {
  CampaignSwipeFeed,
  CAMPAIGN_FEED_PEEK_PX,
  type SwipeFeedRenderOptions,
} from '../../../../components/influencer/CampaignSwipeFeed';
import type { OpportunityStatusTone } from '@/lib/opportunity-card-ui';
import { canOpenCampaignContract, isParticipationEnrolled } from '@/lib/campaign-participation-ui';

type PagerPage = 'exclusive' | 'public' | 'mine';
const PAGER_PAGES: PagerPage[] = ['exclusive', 'public', 'mine'];

type MineFeedItem =
  | { kind: 'exclusive'; id: string; campaign: Campaign; status: 'joined' | 'applied' }
  | { kind: 'ugc'; id: string; row: UgcApplicationRow };

const MAIN_TABS_BASE = [
  { key: 'campaigns', label: 'Campaigns', icon: 'layers-outline' as const },
  { key: 'my-partnerships', label: 'Mine', icon: 'folder-outline' as const },
];

const CAMPAIGN_KIND_SEGMENTS = [
  { key: 'exclusive', label: 'Exclusive' },
  { key: 'public', label: 'Public' },
];

function campaignsHeaderCopy(kind: 'exclusive' | 'public'): { title: string; subtitle: string } {
  if (kind === 'public') {
    return {
      title: 'Campaigns',
      subtitle: 'UGC briefs and public opportunities',
    };
  }
  return {
    title: 'Campaigns',
    subtitle: 'Exclusive brand collaborations',
  };
}

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

type TenantOption = {
  id: string;
  tenantName: string;
  domain: string;
  subdomain: string;
  status: string;
};

function normStatus(s: unknown) {
  return String(s ?? '')
    .trim()
    .toLowerCase();
}

function findParticipationForCampaign(
  list:
    | {
        id?: string;
        campaignId?: string;
        status?: string;
        inviteId?: string | null;
        campaign?: { id?: string } | null;
      }[]
    | undefined,
  campaignId: string
) {
  if (!Array.isArray(list)) return undefined;
  const cid = String(campaignId ?? '')
    .trim()
    .toLowerCase();
  return list.find((p) => {
    if (!p) return false;
    const pid = String(p.campaignId ?? '')
      .trim()
      .toLowerCase();
    const nested = String(p.campaign?.id ?? '')
      .trim()
      .toLowerCase();
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
  const cid = String(campaignId ?? '')
    .trim()
    .toLowerCase();
  return apps.find((a) => {
    if (!a) return false;
    const aid = String(a.campaignId ?? '')
      .trim()
      .toLowerCase();
    const nested = String(a.campaign?.id ?? '')
      .trim()
      .toLowerCase();
    return aid === cid || nested === cid;
  });
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

function buildCampaignMetaLine(campaign: Campaign): string {
  const niche = campaign.requiredInfluencerNiche
    ? String(campaign.requiredInfluencerNiche).replace(/_/g, ' ')
    : 'General';
  const nicheLabel = niche.charAt(0).toUpperCase() + niche.slice(1);
  const platform = campaign.preferredSocialMedia
    ? String(campaign.preferredSocialMedia).replace(/_/g, ' ')
    : null;
  return platform ? `${nicheLabel} • ${platform}` : nicheLabel;
}

function isPastCampaignDeadline(endDate?: string | null): boolean {
  if (!endDate) return false;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return false;
  end.setHours(23, 59, 59, 999);
  return end.getTime() < Date.now();
}

function isActiveUgcApplication(row: UgcApplicationRow): boolean {
  const appStatus = String(row.application?.status ?? row.status ?? '')
    .trim()
    .toLowerCase();
  const d = String(row.deliverable?.status ?? '')
    .trim()
    .toLowerCase();
  const pay = String(row.payment?.status ?? '')
    .trim()
    .toLowerCase();
  if (
    d === 'approved' ||
    pay === 'released' ||
    appStatus === 'completed' ||
    appStatus === 'declined'
  ) {
    return false;
  }
  const deadline = row.brief?.deadline;
  if (deadline && isPastCampaignDeadline(String(deadline))) return false;
  return true;
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
      badge: null,
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
          } else {
            handlers.handleViewCampaign(cid);
          }
        } catch (error) {
          console.error('Error navigating to progress:', error);
        }
      },
    };
  }

  if (status === 'applied') {
    const participation = findParticipationForCampaign(participations, cid);
    const application = applicationForCampaign(applications, cid);
    const enrolled = isParticipationEnrolled(participation, application?.status);
    const canOpenContract = canOpenCampaignContract(participation, application);

    if (canOpenContract) {
      return {
        badge: null,
        buttonLabel: 'Open contract',
        onPress: () => {
          handlers.router.push(`/influencer/contract?participationId=${participation!.id}`);
        },
      };
    }

    if (enrolled) {
      return {
        badge: null,
        buttonLabel: 'Track Progress',
        onPress: () => {
          try {
            const p = findParticipationForCampaign(participations, cid);
            if (p?.id) {
              handlers.router.push({
                pathname: '/influencer/campaign-progress',
                params: { participationId: String(p.id), campaignId: cid },
              });
            } else {
              handlers.handleViewCampaign(cid);
            }
          } catch (error) {
            console.error('Error navigating to progress:', error);
          }
        },
      };
    }

    return {
      badge: null,
      buttonLabel: 'View details',
      onPress: () => handlers.handleViewCampaign(cid),
    };
  }

  // Available: primary CTA only
  return {
    badge: null,
    buttonLabel: 'View & Apply',
    onPress: () => handlers.handleViewCampaign(cid),
  };
}

export default function InfluencerCampaignsScreen() {
  const shell = useAppShell();
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
  const params = useLocalSearchParams<{ segment?: string; campaignId?: string }>();
  const [tab, setTab] = useState('campaigns');
  const [campaignKind, setCampaignKind] = useState<'exclusive' | 'public'>('exclusive');
  const [pagerWidth, setPagerWidth] = useState(0);
  const pagerRef = useRef<FlatList<PagerPage>>(null);
  const pagerIndexRef = useRef(0);
  const headerCopy =
    tab === 'my-partnerships'
      ? {
          title: 'My Campaigns',
          subtitle: 'Exclusive partnerships and public applications',
        }
      : campaignsHeaderCopy(campaignKind);
  const {
    jobs: ugcJobs,
    applications: ugcApplications,
    loading: ugcLoading,
    error: ugcError,
    fetchJobs,
    fetchApplications,
  } = useUgcStore();

  useEffect(() => {
    if (params.segment === 'public') {
      setTab('campaigns');
      setCampaignKind('public');
      pagerIndexRef.current = 1;
      if (pagerWidth > 0) {
        pagerRef.current?.scrollToIndex({ index: 1, animated: false });
      }
    }
  }, [params.segment, pagerWidth]);

  const syncChromeFromPage = useCallback((page: PagerPage) => {
    if (page === 'mine') {
      setTab('my-partnerships');
      return;
    }
    setTab('campaigns');
    setCampaignKind(page);
  }, []);

  const goToPage = useCallback(
    (page: PagerPage, animated = true) => {
      const index = PAGER_PAGES.indexOf(page);
      if (index < 0) return;
      pagerIndexRef.current = index;
      syncChromeFromPage(page);
      if (pagerWidth > 0) {
        pagerRef.current?.scrollToIndex({ index, animated });
      }
    },
    [pagerWidth, syncChromeFromPage]
  );

  const handleMainTabChange = useCallback(
    (key: string) => {
      if (key === 'my-partnerships') {
        goToPage('mine');
        return;
      }
      goToPage(campaignKind === 'public' ? 'public' : 'exclusive');
    },
    [campaignKind, goToPage]
  );

  const handleKindChange = useCallback(
    (key: string) => {
      goToPage(key === 'public' ? 'public' : 'exclusive');
    },
    [goToPage]
  );

  useFocusEffect(
    useCallback(() => {
      if (tab === 'campaigns' && campaignKind === 'public') {
        void fetchJobs();
        return;
      }
      if (tab === 'my-partnerships') {
        void fetchApplications();
      }
    }, [tab, campaignKind, fetchJobs, fetchApplications])
  );
  const [refreshing, setRefreshing] = useState(false);
  const [feedHeight, setFeedHeight] = useState(0);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);

  useEffect(() => {
    if (params.segment !== 'mine') return;
    setTab('my-partnerships');
    pagerIndexRef.current = 2;
    if (pagerWidth > 0) {
      pagerRef.current?.scrollToIndex({ index: 2, animated: false });
    }
    const cid = String(params.campaignId ?? '').trim();
    if (cid) {
      setSelectedCampaignId(cid);
      setShowCampaignDetails(true);
    }
  }, [params.segment, params.campaignId, pagerWidth]);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    requiredNiche: 'all',
    dateRange: null as { from: Date | null; to: Date | null } | null,
    tenantId: 'all',
  });
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [tenantsError, setTenantsError] = useState<string | null>(null);
  const router = useRouter();

  const openUgcDeliver = useCallback(
    (appId: string, title: string) => {
      router.push(
        `/influencer/ugc-deliver?applicationId=${encodeURIComponent(appId)}&title=${encodeURIComponent(title)}` as never
      );
    },
    [router]
  );

  const onUgcApplicationPress = useCallback(
    (row: UgcApplicationRow) => {
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
    },
    [openUgcDeliver, router]
  );

  const ugcList = ugcJobs;

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchCampaigns();
        await fetchParticipations();
        await fetchMyApplications();
        await fetchApplications();
        await fetchTenants();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [fetchCampaigns, fetchParticipations, fetchMyApplications, fetchApplications]);

  const fetchTenants = async () => {
    try {
      const response = (await api.get('/api/tenants')) as unknown;
      if (response && Array.isArray(response)) {
        setTenants(response as TenantOption[]);
        setTenantsError(null);
      } else {
        console.error('Unexpected /api/tenants response shape:', response);
        setTenantsError('Could not load brand filters right now.');
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
      setTenantsError('Could not load brand filters right now.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCampaigns();
      await fetchParticipations();
      await fetchMyApplications();
      await fetchTenants();
      if (tab === 'campaigns' && campaignKind === 'public') {
        await fetchJobs();
      }
      if (tab === 'my-partnerships') {
        await fetchApplications();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewCampaign = useCallback((campaignId: string) => {
    try {
      setSelectedCampaignId(campaignId);
      setShowCampaignDetails(true);
    } catch (error) {
      console.error('Error viewing campaign:', error);
      Alert.alert('Error', 'Failed to load campaign details');
    }
  }, []);

  const handleCloseCampaignDetails = () => {
    setShowCampaignDetails(false);
    setSelectedCampaignId(null);
  };

  const handleBrowseMoreAfterApply = () => {
    setShowCampaignDetails(false);
    setSelectedCampaignId(null);
    // Stay on current Available page (Exclusive or Public).
    if (tab === 'my-partnerships') {
      goToPage(campaignKind === 'public' ? 'public' : 'exclusive');
    }
    void fetchParticipations();
    void fetchMyApplications();
    void fetchJobs();
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      requiredNiche: 'all',
      dateRange: null,
      tenantId: 'all',
    });
  };

  const handleNicheChipPress = (niche: string) => {
    setFilters((prev) => ({
      ...prev,
      requiredNiche: prev.requiredNiche === niche ? 'all' : niche,
    }));
  };

  // Filter campaigns based on current filters
  const filterCampaigns = (campaignsToFilter: Campaign[]) => {
    if (!Array.isArray(campaignsToFilter)) {
      return [];
    }

    return campaignsToFilter.filter((campaign) => {
      if (!campaign) return false;

      try {
        // Niche filter - case insensitive comparison
        if (
          filters.requiredNiche !== 'all' &&
          campaign.requiredInfluencerNiche?.toLowerCase() !== filters.requiredNiche.toLowerCase()
        ) {
          return false;
        }
        // Tenant filter
        if (filters.tenantId !== 'all' && campaign.tenantId !== filters.tenantId) {
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
        .map((p) => String(p.campaignId ?? p.campaign?.id ?? ''))
        .filter(Boolean)
    : [];
  const appliedIds = Array.isArray(participations)
    ? participations
        .filter((p) => p && pendingStatuses.has(normStatus(p.status)))
        .map((p) => String(p.campaignId ?? p.campaign?.id ?? ''))
        .filter(Boolean)
    : [];
  const appliedCampaignIds = Array.isArray(applications)
    ? applications
        .filter(
          (a) =>
            a &&
            [
              'applied',
              'pending_review',
              'approved',
              'contract_pending',
              'contract_signed',
              'rejected',
            ].includes(normStatus(a.status))
        )
        .map((a) => String(a.campaignId ?? a.campaign?.id ?? ''))
        .filter(Boolean)
    : [];
  const unavailableIds = new Set(
    [...joinedIds, ...appliedIds, ...appliedCampaignIds].map((id) => String(id))
  );
  const availableCampaigns = filterCampaigns(
    Array.isArray(campaigns) ? campaigns.filter((c) => c && !unavailableIds.has(String(c.id))) : []
  );
  const myCampaignIds = new Set([...unavailableIds]);
  const myCampaigns = filterCampaigns(
    Array.isArray(campaigns) ? campaigns.filter((c) => c && myCampaignIds.has(String(c.id))) : []
  );

  const claimedUgcBriefIds = useMemo(() => {
    const ids = new Set<string>();
    (Array.isArray(ugcApplications) ? ugcApplications : []).forEach((row) => {
      const briefId = String(row.brief?.id ?? '');
      if (briefId) ids.add(briefId);
    });
    return ids;
  }, [ugcApplications]);

  const availableUgcList = useMemo(() => {
    const list = Array.isArray(ugcList) ? ugcList : [];
    return list.filter((item) => {
      const brief = item as Record<string, unknown>;
      const id = String(brief.id ?? '');
      if (!id) return true;
      if (Boolean(brief.hasApplied)) return false;
      if (claimedUgcBriefIds.has(id)) return false;
      return true;
    });
  }, [ugcList, claimedUgcBriefIds]);

  const joinedIdSet = useMemo(() => new Set(joinedIds.map((id) => String(id))), [joinedIds]);

  const mineFeedItems = useMemo((): MineFeedItem[] => {
    const exclusiveItems: MineFeedItem[] = myCampaigns.map((c) => ({
      kind: 'exclusive' as const,
      id: String(c.id),
      campaign: c,
      status: joinedIdSet.has(String(c.id)) ? ('joined' as const) : ('applied' as const),
    }));
    const ugcItems: MineFeedItem[] = (Array.isArray(ugcApplications) ? ugcApplications : []).map(
      (row, idx) => {
        const app = appFromRow(row);
        const briefId = String(row.brief?.id ?? idx);
        return {
          kind: 'ugc' as const,
          id: String(app.id || briefId),
          row,
        };
      }
    );
    return [...exclusiveItems, ...ugcItems];
  }, [myCampaigns, ugcApplications, joinedIdSet]);

  const mineActiveCount = useMemo(() => {
    const exclusiveActive = myCampaigns.filter((c) => {
      if (!c) return false;
      if (isPastCampaignDeadline(c.endDate ?? null)) return false;
      const cid = String(c.id);
      const p = findParticipationForCampaign(participations, cid);
      const pSt = normStatus(p?.status);
      if (pSt === 'completed') return false;
      if (['active', 'invited', 'accepted', 'contract_pending'].includes(pSt)) return true;
      const app = applicationForCampaign(applications, cid);
      const appSt = normStatus(app?.status);
      return [
        'applied',
        'pending_review',
        'approved',
        'contract_pending',
        'contract_signed',
      ].includes(appSt);
    }).length;
    const publicActive = (Array.isArray(ugcApplications) ? ugcApplications : []).filter(
      isActiveUgcApplication
    ).length;
    return exclusiveActive + publicActive;
  }, [myCampaigns, participations, applications, ugcApplications]);

  const renderUgcApplicationCard = useCallback(
    (row: UgcApplicationRow, idx: number, options?: SwipeFeedRenderOptions) => {
      const app = appFromRow(row);
      const brief = row.brief ?? {};
      const title = String(brief.title ?? 'UGC Brief');
      const budget = Number(brief.budgetPerPiece ?? 0);
      const productName = String(brief.productName ?? 'Brand brief');
      const contentType = String(brief.contentType ?? 'ugc_video');
      const typeLabel = labelForContentType(contentType);
      const showDeliver = canDeliverContent(row) && Boolean(app.id);
      const deadline = formatUgcDeadline(brief.deadline);

      return (
        <CampaignReferenceCard
          key={app.id || String(brief.id ?? idx)}
          style={styles.campaignCard}
          fillHeight={false}
          title={title}
          brandName={productName}
          metaLine={typeLabel}
          statusLabel={null}
          commissionRate={`₹${budget.toLocaleString('en-IN')}`}
          duration={deadline ? `Due ${deadline}` : 'TBD'}
          rateLabel="/ piece"
          footerBadge={null}
          footerButtonLabel={showDeliver ? 'Deliver content' : 'View details'}
          onFooterPress={() => {
            if (showDeliver) openUgcDeliver(app.id, title);
            else onUgcApplicationPress(row);
          }}
          onPress={() => onUgcApplicationPress(row)}
        />
      );
    },
    [openUgcDeliver, onUgcApplicationPress]
  );

  const mainTabs = useMemo(
    () =>
      MAIN_TABS_BASE.map((t) =>
        t.key === 'my-partnerships' ? { ...t, badge: mineActiveCount } : t
      ),
    [mineActiveCount]
  );

  const hasAdvancedFilters = useMemo(() => {
    return filters.tenantId !== 'all' || !!filters.dateRange;
  }, [filters.tenantId, filters.dateRange]);

  const showExclusiveChrome = tab === 'campaigns' && campaignKind === 'exclusive';
  const showMineChrome = tab === 'my-partnerships';
  const showPartnershipFilters = showExclusiveChrome || showMineChrome;

  const renderCampaignCard = useCallback(
    (
      campaign: Campaign,
      status: 'available' | 'applied' | 'joined',
      options?: SwipeFeedRenderOptions
    ) => {
      if (!campaign) return null;

      try {
        const cid = String(campaign.id);
        const footer = buildCampaignReferenceFooter(
          campaign,
          status,
          applications,
          participations,
          {
            handleViewCampaign,
            router,
          }
        );
        const isMine = status === 'applied' || status === 'joined';
        const mineStatus = isMine
          ? buildMineCampaignStatus(cid, participations, applications)
          : null;
        const statusLabel = isMine
          ? (mineStatus?.label ?? null)
          : campaignAvailableLabel(String(campaign.status || 'active'));
        const statusTone: OpportunityStatusTone | undefined = isMine
          ? mineStatus?.tone
          : campaignAvailableTone(String(campaign.status || 'active'));

        const shortDescription =
          (campaign.description && String(campaign.description).trim()) ||
          (campaign.basicGuidelines && String(campaign.basicGuidelines).trim()) ||
          null;
        const pay = resolveCampaignPaySummary(campaign);

        return (
          <CampaignReferenceCard
            key={cid}
            style={styles.campaignCard}
            fillHeight={false}
            title={String(campaign.name || 'Untitled Campaign')}
            brandName={String(campaign.tenant?.tenantName || 'Unknown brand')}
            metaLine={buildCampaignMetaLine(campaign)}
            statusLabel={statusLabel}
            statusTone={statusTone}
            commissionRate={pay.primaryLabel}
            duration={formatCampaignDurationRange(
              campaign.startDate,
              campaign.endDate ?? undefined
            )}
            brandLogoUrl={campaign.brandLogoUrl}
            shortDescription={shortDescription}
            rateLabel={pay.secondaryLabel.toLowerCase()}
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
    },
    [applications, participations, handleViewCampaign, router]
  );

  const onPagerScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pagerWidth <= 0) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / pagerWidth);
    const clamped = Math.max(0, Math.min(PAGER_PAGES.length - 1, index));
    if (clamped === pagerIndexRef.current) return;
    pagerIndexRef.current = clamped;
    syncChromeFromPage(PAGER_PAGES[clamped]);
    if (PAGER_PAGES[clamped] === 'public') void fetchJobs();
    if (PAGER_PAGES[clamped] === 'mine') void fetchApplications();
  };

  const renderPagerPage = (page: PagerPage) => {
    if (page === 'exclusive') {
      if (isLoading && !refreshing && showPartnershipFilters) {
        return <ActivityIndicator size="large" color={appShell.cta} style={{ marginTop: 40 }} />;
      }
      if (availableCampaigns.length === 0) {
        return (
          <View style={styles.emptyFeed}>
            <Text style={styles.emptyText}>
              {filters.requiredNiche !== 'all' || filters.tenantId !== 'all' || filters.dateRange
                ? 'No campaigns match your current filters.'
                : 'No available campaigns.'}
            </Text>
          </View>
        );
      }
      return (
        <CampaignSwipeFeed
          data={availableCampaigns}
          itemHeight={feedHeight}
          peekPx={CAMPAIGN_FEED_PEEK_PX}
          keyExtractor={(c) => String(c.id)}
          renderItem={(c, _i, opts) => renderCampaignCard(c, 'available', opts)}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      );
    }

    if (page === 'public') {
      if (ugcLoading && availableUgcList.length === 0) {
        return <ActivityIndicator color={appShell.cta} style={{ marginTop: spacing.lg }} />;
      }
      if (ugcError) {
        return (
          <View style={styles.ugcEmptyBlock}>
            <Text style={styles.ugcError}>{ugcError}</Text>
            <TouchableOpacity style={styles.ugcRetryBtn} onPress={() => void fetchJobs()}>
              <Text style={styles.ugcRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        );
      }
      if (availableUgcList.length === 0) {
        return (
          <View style={styles.emptyFeed}>
            <Text style={styles.emptyText}>
              No open public briefs right now. Check back when a brand posts a new brief.
            </Text>
          </View>
        );
      }
      return (
        <CampaignSwipeFeed
          data={availableUgcList}
          itemHeight={feedHeight}
          peekPx={CAMPAIGN_FEED_PEEK_PX}
          keyExtractor={(item, idx) => String((item as Record<string, unknown>).id ?? idx)}
          renderItem={(item, idx, opts) => {
            const brief = item as Record<string, unknown>;
            const id = String(brief.id ?? idx);
            const title = String(brief.title ?? 'UGC Brief');
            const budget = Number(brief.budgetPerPiece ?? 0);
            const productName = String(brief.productName ?? 'Brand brief');
            const contentType = String(brief.contentType ?? 'ugc_video');
            const deadline = formatUgcDeadline(brief.deadline);
            const typeLabel = labelForContentType(contentType);
            const description =
              typeof brief.description === 'string' && brief.description.trim()
                ? brief.description
                : null;

            return (
              <CampaignReferenceCard
                style={styles.campaignCard}
                fillHeight={false}
                title={title}
                brandName={productName}
                metaLine={typeLabel}
                statusLabel="Open"
                statusTone={ugcJobTone(false)}
                commissionRate={`₹${budget.toLocaleString('en-IN')}`}
                duration={deadline ? `Due ${deadline}` : 'TBD'}
                rateLabel="/ piece"
                shortDescription={description}
                footerBadge={null}
                footerButtonLabel="View & Apply"
                onFooterPress={() => router.push(`/influencer/ugc-brief-detail?id=${id}` as never)}
                onPress={() => router.push(`/influencer/ugc-brief-detail?id=${id}` as never)}
              />
            );
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      );
    }

    // Mine
    if (isLoading && !refreshing && mineFeedItems.length === 0) {
      return <ActivityIndicator color={appShell.cta} style={{ marginTop: spacing.lg }} />;
    }
    if (mineFeedItems.length === 0) {
      return (
        <View style={styles.emptyFeed}>
          <Text style={styles.emptyText}>
            {filters.requiredNiche !== 'all' || filters.tenantId !== 'all' || filters.dateRange
              ? 'No campaigns match your current filters.'
              : 'Nothing in Mine yet. Apply to Exclusive or Public campaigns to see them here.'}
          </Text>
        </View>
      );
    }
    return (
      <CampaignSwipeFeed
        data={mineFeedItems}
        itemHeight={feedHeight}
        peekPx={CAMPAIGN_FEED_PEEK_PX}
        keyExtractor={(item) => item.id}
        renderItem={(item, _idx, opts) => {
          if (item.kind === 'exclusive') {
            return renderCampaignCard(item.campaign, item.status, opts);
          }
          return renderUgcApplicationCard(item.row, 0, opts);
        }}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: shell.canvas }}>
      <View
        style={[
          styles.topChrome,
          { backgroundColor: shell.canvas, borderBottomColor: shell.borderSubtle },
        ]}
      >
        <View style={styles.tabsRow}>
          <UnderlineTabBar tabs={mainTabs} value={tab} onChange={handleMainTabChange} />
        </View>

        <View style={[styles.header, { backgroundColor: shell.canvas }]}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitles}>
              <Text style={[styles.headerTitle, { color: shell.textPrimary }]}>
                {headerCopy.title}
              </Text>
              <Text style={[styles.headerSubTitle, { color: shell.textSecondary }]}>
                {headerCopy.subtitle}
              </Text>
            </View>
            {showPartnershipFilters ? (
              <TouchableOpacity
                style={[styles.filterIconBtn, hasAdvancedFilters && styles.filterIconBtnActive]}
                onPress={() => setShowAdvancedFilters(true)}
              >
                <Ionicons
                  name="options-outline"
                  size={18}
                  color={hasAdvancedFilters ? palette.white : shell.cta}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {tab === 'campaigns' ? (
            <PremiumSegmentedControl
              segments={CAMPAIGN_KIND_SEGMENTS}
              value={campaignKind}
              onChange={handleKindChange}
              compact
              style={{ marginBottom: spacing.xs }}
            />
          ) : null}

          {showPartnershipFilters ? (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.nicheRow}
              >
                {NICHE_CHIPS.map((chip) => {
                  const active =
                    filters.requiredNiche === chip.key ||
                    (chip.key === 'all' && filters.requiredNiche === 'all');
                  return (
                    <TouchableOpacity
                      key={chip.key}
                      style={[styles.nicheChip, active && styles.nicheChipActive]}
                      onPress={() => handleNicheChipPress(chip.key)}
                    >
                      <Text style={[styles.nicheChipText, active && styles.nicheChipTextActive]}>
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : null}
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View
        style={styles.feedShell}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          const nextH = Math.round(height);
          const nextW = Math.round(width);
          if (nextH > 0 && nextH !== feedHeight) setFeedHeight(nextH);
          if (nextW > 0 && nextW !== pagerWidth) setPagerWidth(nextW);
        }}
      >
        {pagerWidth > 0 && feedHeight > 0 ? (
          <FlatList
            ref={pagerRef}
            data={PAGER_PAGES}
            keyExtractor={(item) => item}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            directionalLockEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onMomentumScrollEnd={onPagerScrollEnd}
            getItemLayout={(_data, index) => ({
              length: pagerWidth,
              offset: pagerWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={[styles.pagerPage, { width: pagerWidth, height: feedHeight }]}>
                {renderPagerPage(item)}
              </View>
            )}
          />
        ) : null}
      </View>

      <Modal
        visible={showAdvancedFilters}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAdvancedFilters(false)}
      >
        <View style={styles.filtersModalOverlay}>
          <View style={[styles.filtersModalCard, { backgroundColor: shell.card }]}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Advanced Filters</Text>
              <TouchableOpacity onPress={() => setShowAdvancedFilters(false)}>
                <Ionicons name="close" size={22} color={appShell.cta} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Brand</Text>
            {tenantsError ? <Text style={styles.tenantsErrorText}>{tenantsError}</Text> : null}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.inlineFilterRow}
            >
              <TouchableOpacity
                style={[
                  styles.inlineFilterChip,
                  filters.tenantId === 'all' && styles.inlineFilterChipActive,
                ]}
                onPress={() => handleFilterChange({ ...filters, tenantId: 'all' })}
              >
                <Text
                  style={[
                    styles.inlineFilterText,
                    filters.tenantId === 'all' && styles.inlineFilterTextActive,
                  ]}
                >
                  All Brands
                </Text>
              </TouchableOpacity>
              {tenants.map((tenant) => {
                const active = filters.tenantId === tenant.id;
                return (
                  <TouchableOpacity
                    key={tenant.id}
                    style={[styles.inlineFilterChip, active && styles.inlineFilterChipActive]}
                    onPress={() => handleFilterChange({ ...filters, tenantId: tenant.id })}
                  >
                    <Text
                      style={[styles.inlineFilterText, active && styles.inlineFilterTextActive]}
                    >
                      {tenant.tenantName}
                    </Text>
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
        <View style={{ flex: 1, backgroundColor: shell.canvas }}>
          {selectedCampaignId ? (
            <CampaignDetailsScreen
              campaignId={selectedCampaignId}
              onClose={handleCloseCampaignDetails}
              onBrowseMore={handleBrowseMoreAfterApply}
              showModalHeader
            />
          ) : null}
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
    paddingBottom: spacing.xs,
    backgroundColor: appShell.canvas,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
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
  nicheRow: {
    paddingTop: 2,
    paddingBottom: 2,
    gap: 8,
  },
  nicheChip: {
    paddingVertical: 7,
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
  tenantsErrorText: {
    marginTop: 4,
    color: palette.error,
    fontSize: 12,
    fontFamily: fonts.regular,
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
  pagerPage: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
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
  ugcFeedContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
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
