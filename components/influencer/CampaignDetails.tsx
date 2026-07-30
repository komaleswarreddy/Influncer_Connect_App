import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useCampaignStore } from '../../store/campaign-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appShell, premiumNavy, radius, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';
import { LinearGradient } from 'expo-linear-gradient';
import {
  SecondaryButton,
  PrimaryButton,
  PremiumActionPopover,
  StackedScreenTitle,
  UnderlineTabBar,
  type UnderlineTab,
} from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { canOpenCampaignContract, isParticipationEnrolled } from '@/lib/campaign-participation-ui';
import {
  resolveCampaignPaySummary,
  type CampaignPaySummary,
  type CampaignPaymentModel,
} from '@/lib/campaign-pay-summary';
import { formatCampaignDisplayName } from '@/lib/format-campaign-display-name';
import { CampaignProgressPanel } from '@/components/influencer/CampaignProgressPanel';
import { useAppShell } from '@/theme/useAppShell';

type TabKey = 'progress' | 'earnings' | 'details' | 'deliverables';

const BASE_TABS: { key: TabKey; label: string }[] = [
  { key: 'earnings', label: 'Earnings' },
  { key: 'details', label: 'Details' },
  { key: 'deliverables', label: 'Deliverables' },
];

interface CampaignDetailsProps {
  campaignId?: string;
  onClose?: () => void;
  onApplySuccess?: (participation: { id?: string | null }) => void;
  /** Close details and return user to Available browse after apply. */
  onBrowseMore?: () => void;
  /** When true, renders sheet header with title + primary action on the right. */
  showModalHeader?: boolean;
}

type CampaignRequirement = {
  type: string;
  count: number;
  schedule?: string;
  description?: string;
};

type CampaignView = {
  id: string;
  name: string;
  description: string;
  status: string;
  type: string;
  startDate?: string;
  endDate?: string;
  targetAudienceAgeGroup: string;
  requiredInfluencerNiche: string;
  basicGuidelines: string;
  preferredSocialMedia: string;
  commissionRate?: string | number | null;
  paymentModel?: CampaignPaymentModel | null;
  paySummary?: CampaignPaySummary | null;
  brandLogoUrl?: string | null;
  contentRequirements?: CampaignRequirement[];
  tenant?: {
    id?: string;
    tenantName?: string;
  } | null;
};

export default function CampaignDetailsScreen({
  campaignId,
  onClose,
  onApplySuccess,
  onBrowseMore,
  showModalHeader = false,
}: CampaignDetailsProps) {
  const router = useRouter();
  const {
    fetchCampaign,
    fetchParticipations,
    fetchMyApplications,
    applications,
    applyToCampaign,
    participations,
    isLoading,
  } = useCampaignStore();
  const [campaign, setCampaign] = useState<CampaignView | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFull, setShowFull] = useState<{ desc: boolean; guidelines: boolean }>({
    desc: false,
    guidelines: false,
  });
  const [showApplySuccessPopover, setShowApplySuccessPopover] = useState(false);
  const shell = useAppShell();

  const normalizedCampaignId = String(campaignId ?? '')
    .trim()
    .toLowerCase();
  const participationEarly = participations.find((p) => {
    const pid = String(p.campaignId ?? '')
      .trim()
      .toLowerCase();
    const nested = String((p as { campaign?: { id?: string } }).campaign?.id ?? '')
      .trim()
      .toLowerCase();
    return pid === normalizedCampaignId || nested === normalizedCampaignId;
  });
  const applicationEarly = applications.find((a) => {
    const aid = String(a.campaignId ?? '')
      .trim()
      .toLowerCase();
    const nested = String((a as { campaign?: { id?: string } }).campaign?.id ?? '')
      .trim()
      .toLowerCase();
    return aid === normalizedCampaignId || nested === normalizedCampaignId;
  });
  const applicationStatusEarly = String(applicationEarly?.status ?? '')
    .trim()
    .toLowerCase();
  const isJoinedEarly = isParticipationEnrolled(participationEarly, applicationStatusEarly);

  const tabs = useMemo((): UnderlineTab[] => {
    if (isJoinedEarly) {
      return [
        {
          key: 'progress',
          label: 'Track Progress',
          labelLine1: 'Track',
          labelLine2: 'Progress',
        },
        ...BASE_TABS.map((t) => ({ key: t.key, label: t.label })),
      ];
    }
    return BASE_TABS.map((t) => ({ key: t.key, label: t.label }));
  }, [isJoinedEarly]);

  const [activeTab, setActiveTab] = useState<TabKey>('earnings');
  const { width: windowWidth } = useWindowDimensions();
  const [pageWidth, setPageWidth] = useState<number>(windowWidth);
  const pagerRef = useRef<ScrollView | null>(null);
  const didSetJoinedDefaultTab = useRef(false);

  useEffect(() => {
    if (isJoinedEarly && !didSetJoinedDefaultTab.current) {
      didSetJoinedDefaultTab.current = true;
      setActiveTab('progress');
      pagerRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    }
    if (!isJoinedEarly) {
      didSetJoinedDefaultTab.current = false;
      if (activeTab === 'progress') setActiveTab('earnings');
    }
  }, [isJoinedEarly, activeTab]);

  const tabIndex = tabs.findIndex((t) => t.key === activeTab);
  const shouldRenderTab = (idx: number) => Math.abs(idx - tabIndex) <= 1;

  const handleTabChange = (key: string) => {
    const idx = tabs.findIndex((t) => t.key === key);
    if (idx < 0) return;
    setActiveTab(tabs[idx].key);
    pagerRef.current?.scrollTo({ x: idx * pageWidth, y: 0, animated: true });
  };

  const handlePagerLayout = (e: NativeSyntheticEvent<{ layout: { width: number } }>) => {
    const next = e.nativeEvent.layout.width;
    if (next > 0 && next !== pageWidth) setPageWidth(next);
  };

  const handlePagerMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!pageWidth) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (idx < 0 || idx >= tabs.length) return;
    const nextKey = tabs[idx].key;
    if (nextKey !== activeTab) setActiveTab(nextKey);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (campaignId) {
        const c = await fetchCampaign(campaignId);
        await fetchParticipations();
        await fetchMyApplications();
        setCampaign(c);
      }
      setLoading(false);
    };
    load();
  }, [campaignId, fetchCampaign, fetchParticipations, fetchMyApplications]);

  if (loading || isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: shell.canvas,
        }}
      >
        <ActivityIndicator size="large" color={shell.cta} />
      </SafeAreaView>
    );
  }
  if (!campaign) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: shell.canvas,
        }}
      >
        <Text>Campaign not found.</Text>
      </SafeAreaView>
    );
  }

  const participation = participationEarly;
  const application = applicationEarly;
  const applicationStatusNorm = applicationStatusEarly;
  const isJoined = isJoinedEarly;

  const canShowContract = canOpenCampaignContract(participation, application);

  const awaitingBrandApproval =
    ['applied', 'pending_review'].includes(applicationStatusNorm) && !participation;

  const isApplicationRejected = applicationStatusNorm === 'rejected';

  const showRejectedReapply = !participation && isApplicationRejected;

  const showFirstTimeApply = !participation && !application;

  const approvedButNoParticipationYet = applicationStatusNorm === 'approved' && !participation?.id;

  const renderReadMore = (text: string, field: keyof typeof showFull, limit: number = 120) => {
    if (!text) return null;
    const isLong = text.length > limit;
    const displayText = !isLong || showFull[field] ? text : text.slice(0, limit) + '...';
    return (
      <>
        <Text style={styles.sectionText}>{displayText}</Text>
        {isLong && (
          <TouchableOpacity onPress={() => setShowFull((s) => ({ ...s, [field]: !s[field] }))}>
            <Text style={styles.readMore}>{showFull[field] ? 'Show less' : 'Read more'}</Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  const handleApply = async () => {
    try {
      await applyToCampaign(campaign.id);
      await fetchParticipations();
      await fetchMyApplications();
      setShowApplySuccessPopover(true);
    } catch (e: unknown) {
      console.error('Error in handleApply:', e);
      const msg = e instanceof Error ? e.message : 'Failed to apply for campaign';
      Alert.alert('Error', msg);
    }
  };

  const handleBrowseMoreCampaigns = () => {
    setShowApplySuccessPopover(false);
    if (onBrowseMore) {
      onBrowseMore();
    } else if (onClose) {
      onClose();
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

  const pay = resolveCampaignPaySummary(campaign);
  const fixedPay = Number(campaign.paymentModel?.fixedBasePay);
  const variablePay = Number(campaign.paymentModel?.variablePayRate);
  const hasFixed = Number.isFinite(fixedPay) && fixedPay > 0;
  const hasVariable = Number.isFinite(variablePay) && variablePay > 0;

  const openContract = () => {
    if (!participation?.id) return;
    onClose?.();
    router.push(`/influencer/contract?participationId=${participation.id}`);
  };

  const headerAction = showFirstTimeApply ? (
    <PrimaryButton compact pill label="Apply for Campaign" onPress={handleApply} />
  ) : showRejectedReapply ? (
    <PrimaryButton compact pill label="Apply again" onPress={handleApply} />
  ) : canShowContract ? (
    <PrimaryButton compact pill label="Open contract" onPress={openContract} />
  ) : null;

  const participationCard = participation ? (
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
            <TouchableOpacity
              style={styles.copyBtn}
              onPress={() => handleCopyPromo(participation.promotionalCodes[0])}
            >
              <Ionicons name="copy-outline" size={16} color={shell.cta} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  ) : null;

  const renderEarningsTab = () => (
    <View style={styles.surfaceCard}>
      <Text style={styles.sectionTitle}>How you earn</Text>
      <View style={styles.payModelPill}>
        <Text style={styles.payModelPillText}>{pay.pillLabel}</Text>
      </View>
      <View style={styles.infoGrid}>
        {hasFixed ? (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              {pay.model === 'hybrid' ? 'Fixed base' : 'Fixed pay'}
            </Text>
            <Text style={styles.infoValue}>₹{Math.round(fixedPay).toLocaleString('en-IN')}</Text>
          </View>
        ) : null}
        {hasVariable ? (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              {pay.model === 'hybrid' ? 'Variable rate' : 'Performance rate'}
            </Text>
            <Text style={styles.infoValue}>
              {variablePay <= 100
                ? `${Number.isInteger(variablePay) ? variablePay : variablePay.toFixed(1)}%`
                : `₹${Math.round(variablePay).toLocaleString('en-IN')}`}
            </Text>
          </View>
        ) : null}
        {pay.model === 'unknown' &&
        campaign.commissionRate != null &&
        Number(campaign.commissionRate) > 0 ? (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Commission</Text>
            <Text style={styles.infoValue}>{Number(campaign.commissionRate)}%</Text>
          </View>
        ) : null}
        {!hasFixed && !hasVariable && pay.model !== 'unknown' ? (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>You earn</Text>
            <Text style={styles.infoValue}>{pay.primaryLabel}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.payHint}>
        {pay.model === 'fixed'
          ? 'You earn a fixed amount for completing this campaign’s deliverables.'
          : pay.model === 'performance'
            ? 'Pay depends on results (sales, conversions, or agreed performance metrics).'
            : pay.model === 'hybrid'
              ? 'You get a fixed base plus a performance-based variable portion.'
              : 'Final pay terms are confirmed in the campaign contract.'}
      </Text>
    </View>
  );

  const renderDetailsTab = () => (
    <>
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
        </View>
      </View>
      <View style={styles.surfaceCard}>
        <Text style={styles.sectionTitle}>Description</Text>
        {renderReadMore(campaign.description, 'desc', 180)}
      </View>
      <View style={styles.surfaceCard}>
        <Text style={styles.sectionTitle}>Basic Guidelines</Text>
        {renderReadMore(campaign.basicGuidelines, 'guidelines', 180)}
      </View>
      <View style={styles.surfaceCard}>
        <Text style={styles.sectionTitle}>Preferred Platform</Text>
        <Text style={styles.sectionText}>{campaign.preferredSocialMedia}</Text>
      </View>
    </>
  );

  const renderDeliverablesTab = () =>
    campaign.contentRequirements && campaign.contentRequirements.length > 0 ? (
      <View style={styles.surfaceCard}>
        <Text style={styles.sectionTitle}>Content Requirements</Text>
        {campaign.contentRequirements.map((req: CampaignRequirement, index: number) => (
          <View key={index} style={styles.requirementItem}>
            <View style={styles.requirementIconTile}>
              <Ionicons
                name={index % 2 === 0 ? 'videocam' : 'document-text'}
                size={14}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.requirementBody}>
              <Text style={styles.requirementTitle}>
                {req.count}x {String(req.type).replace('_', ' ')}
                {req.schedule ? ` (${req.schedule})` : ''}
              </Text>
              {req.description ? (
                <Text style={styles.requirementText}>{req.description}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    ) : null;

  const renderTabPage = (key: TabKey, idx: number) => {
    if (!shouldRenderTab(idx)) return null;
    if (key === 'progress' && participation?.id) {
      return (
        <CampaignProgressPanel
          participationId={String(participation.id)}
          campaignId={String(participation.campaignId ?? campaign.id)}
          embedded
          headerSlot={participationCard}
        />
      );
    }
    if (key === 'earnings') return renderEarningsTab();
    if (key === 'details') return renderDetailsTab();
    if (key === 'deliverables') return renderDeliverablesTab();
    return null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: shell.canvas }}>
      {showModalHeader ? (
        <View
          style={[
            styles.modalHeader,
            { backgroundColor: shell.card, borderBottomColor: shell.borderSubtle },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.modalClose} accessibilityRole="button">
            <Ionicons name="close" size={22} color={appShell.textPrimary} />
          </TouchableOpacity>
          <StackedScreenTitle title="Campaign Details" style={styles.modalTitle} />
          <View style={styles.modalHeaderAction}>{headerAction}</View>
        </View>
      ) : null}
      <View style={styles.scrollContent}>
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
          <Text style={styles.heroOverline}>
            {String(campaign.type || 'Campaign').replace('_', ' ')}
          </Text>
          <Text style={styles.campaignName}>{formatCampaignDisplayName(campaign.name)}</Text>
          <View style={styles.brandHeroRow}>
            {campaign.brandLogoUrl ? (
              <View style={styles.brandHeroLogoWell}>
                <Image
                  source={{ uri: campaign.brandLogoUrl }}
                  style={styles.brandHeroLogo}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={styles.brandHeroLogoFallback}>
                <Ionicons name="business-outline" size={22} color="#FFFFFF" />
              </View>
            )}
            <View style={styles.brandHeroCopy}>
              <Text style={styles.brandHeroLabel}>Brand</Text>
              <Text style={styles.brandHeroName} numberOfLines={1}>
                {campaign.tenant?.tenantName || 'Brand'}
              </Text>
            </View>
          </View>
          <View style={styles.heroBadgeRow}>
            <Text style={styles.statusBadge}>
              {String(campaign.status || 'active').toUpperCase()}
            </Text>
            <Text style={styles.commission}>
              {pay.primaryLabel} · {pay.secondaryLabel}
            </Text>
          </View>
          <View style={styles.quickMetaRow}>
            <View style={styles.quickMetaChip}>
              <Text style={styles.quickMetaLabel}>Niche</Text>
              <Text style={styles.quickMetaValue}>{campaign.requiredInfluencerNiche}</Text>
            </View>
            <View style={styles.quickMetaChip}>
              <Text style={styles.quickMetaLabel}>Platform</Text>
              <Text style={styles.quickMetaValue}>{campaign.preferredSocialMedia}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabPagerWrap}>
          <UnderlineTabBar
            tabs={tabs}
            value={activeTab}
            onChange={handleTabChange}
            scrollable={tabs.length > 3}
            style={styles.tabBar}
          />

          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onMomentumScrollEnd={handlePagerMomentumEnd}
            onLayout={handlePagerLayout}
            style={styles.tabPager}
          >
            {tabs.map((tab, idx) => (
              <View key={tab.key} style={{ width: pageWidth, flex: 1 }}>
                {tab.key === 'progress' ? (
                  shouldRenderTab(idx) ? (
                    renderTabPage(tab.key, idx)
                  ) : null
                ) : (
                  <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    contentContainerStyle={styles.tabScrollContent}
                  >
                    {renderTabPage(tab.key, idx)}
                  </ScrollView>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.bottomArea}>
          {!isJoined && canShowContract ? (
            showModalHeader ? null : (
              <View
                style={[
                  styles.statusCard,
                  { backgroundColor: shell.card, borderColor: shell.cardBorder },
                ]}
              >
                <Text style={[styles.statusCardTitle, { color: shell.textPrimary }]}>
                  Complete your agreement
                </Text>
                <Text style={[styles.statusCardText, { color: shell.textSecondary }]}>
                  Sign the contract to activate your participation and unlock promo codes and
                  progress tracking.
                </Text>
                <SecondaryButton label="Open contract" onPress={openContract} />
              </View>
            )
          ) : !isJoined && approvedButNoParticipationYet ? (
            <View
              style={[
                styles.statusCard,
                { backgroundColor: shell.card, borderColor: shell.cardBorder },
              ]}
            >
              <Text style={[styles.statusCardTitle, { color: shell.textPrimary }]}>Approved</Text>
              <Text style={[styles.statusCardText, { color: shell.textSecondary }]}>
                Your application was approved. Loading your contract — pull refresh if this
                persists.
              </Text>
              <SecondaryButton
                label="Refresh status"
                onPress={async () => {
                  await fetchParticipations();
                  await fetchMyApplications();
                }}
              />
            </View>
          ) : !isJoined && showRejectedReapply ? (
            showModalHeader ? null : (
              <View
                style={[
                  styles.statusCard,
                  { backgroundColor: shell.card, borderColor: shell.cardBorder },
                ]}
              >
                <Text style={[styles.statusCardTitle, { color: shell.textPrimary }]}>
                  Application not approved
                </Text>
                <Text style={[styles.statusCardText, { color: shell.textSecondary }]}>
                  The brand did not approve this application. You can submit again while the
                  campaign is open.
                </Text>
                <PrimaryButton label="Apply again" onPress={handleApply} />
              </View>
            )
          ) : !isJoined && awaitingBrandApproval ? (
            <View
              style={[
                styles.statusCard,
                { backgroundColor: shell.card, borderColor: shell.cardBorder },
              ]}
            >
              <Text style={[styles.statusCardTitle, { color: shell.textPrimary }]}>
                Application submitted
              </Text>
              <Text style={[styles.statusCardText, { color: shell.textSecondary }]}>
                Your application has been sent to the brand. When they approve it, you can sign the
                contract here and track progress.
              </Text>
            </View>
          ) : !isJoined && showFirstTimeApply ? (
            showModalHeader ? null : (
              <View
                style={[
                  styles.statusCard,
                  { backgroundColor: shell.card, borderColor: shell.cardBorder },
                ]}
              >
                <Text style={[styles.statusCardTitle, { color: shell.textPrimary }]}>
                  Apply for this campaign
                </Text>
                <Text style={[styles.statusCardText, { color: shell.textSecondary }]}>
                  Submit your interest to the brand. After approval, you can sign the contract and
                  join.
                </Text>
                <PrimaryButton label="Apply for Campaign" onPress={handleApply} />
              </View>
            )
          ) : !isJoined && participation && !canShowContract ? (
            <View
              style={[
                styles.statusCard,
                { backgroundColor: shell.card, borderColor: shell.cardBorder },
              ]}
            >
              <Text style={[styles.statusCardTitle, { color: shell.textPrimary }]}>
                Waiting for brand approval
              </Text>
              <Text style={[styles.statusCardText, { color: shell.textSecondary }]}>
                The brand still needs to approve your application before you can sign the contract.
                You will be notified when you can proceed.
              </Text>
            </View>
          ) : !isJoined ? (
            <View
              style={[
                styles.statusCard,
                { backgroundColor: shell.card, borderColor: shell.cardBorder },
              ]}
            >
              <Text style={[styles.statusCardTitle, { color: shell.textPrimary }]}>
                Campaign status
              </Text>
              <Text style={[styles.statusCardText, { color: shell.textSecondary }]}>
                Current participation status: {participation?.status ?? 'none'}. If this looks
                wrong, refresh or contact support.
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <PremiumActionPopover
        visible={showApplySuccessPopover}
        title="Application submitted"
        message="Your interest was sent to the brand. Browse more campaigns while you wait for approval."
        primaryLabel="Browse more campaigns"
        onPrimary={handleBrowseMoreCampaigns}
        onRequestClose={handleBrowseMoreCampaigns}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: appShell.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: appShell.borderSubtle,
    gap: spacing.xs,
  },
  modalClose: {
    padding: 6,
  },
  modalTitle: {
    flex: 1,
    marginLeft: 2,
  },
  modalHeaderAction: {
    maxWidth: '52%',
    alignItems: 'flex-end',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  tabPagerWrap: {
    flex: 1,
    minHeight: 0,
    gap: spacing.xs,
  },
  tabBar: {
    // keeps UnderlineTabBar visually separated from pager
  },
  tabPager: {
    flex: 1,
    minHeight: 0,
  },
  tabScrollContent: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  bottomArea: {
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
    flexShrink: 1,
    width: '100%',
  },
  brandHeroRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandHeroLogoWell: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  brandHeroLogo: {
    width: '100%',
    height: '100%',
  },
  brandHeroLogoFallback: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  brandHeroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  brandHeroLabel: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: 'rgba(241,245,249,0.78)',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  brandHeroName: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fonts.bold,
    color: '#FFFFFF',
  },
  heroBadgeRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickMetaRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  quickMetaChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  quickMetaLabel: {
    fontSize: 10,
    color: 'rgba(241,245,249,0.82)',
    fontFamily: fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  quickMetaValue: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: fonts.bold,
    marginTop: 2,
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
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  payModelPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(37, 99, 235, 0.28)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  payModelPillText: {
    fontSize: 11,
    fontFamily: fonts.semiBold,
    color: appShell.cta,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  payHint: {
    marginTop: spacing.xs,
    fontSize: 12,
    lineHeight: 17,
    color: appShell.textMuted,
    fontFamily: fonts.regular,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoItem: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: '40%',
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
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: appShell.cta,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
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
    backgroundColor: appShell.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: appShell.cta,
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
  actionStack: {
    marginTop: spacing.sm,
    gap: spacing.xs,
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
