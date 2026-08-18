import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCampaignStore, type Campaign } from '../../store/campaign-store';
import { useProgressStore } from '../../store/progress-store';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';
import {
  KollabButton,
  KollabStatusChip,
  Glyph,
  showKollabToast,
  type GlyphName,
} from '@/components/ui';
import { canOpenCampaignContract, isParticipationEnrolled } from '@/lib/campaign-participation-ui';
import { resolveCampaignPaySummary } from '@/lib/campaign-pay-summary';
import { formatCampaignDisplayName } from '@/lib/format-campaign-display-name';
import { formatInr } from '@/lib/currency';

type TabKey = 'progress' | 'earnings' | 'details' | 'deliverables';

const BASE_TABS: { key: TabKey; label: string }[] = [
  { key: 'earnings', label: 'Earnings' },
  { key: 'details', label: 'Details' },
  { key: 'deliverables', label: 'Deliverables' },
];

const SHORT_MONTH_DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

interface CampaignDetailsProps {
  campaignId?: string;
  onClose?: () => void;
  onApplySuccess?: (participation: { id?: string | null }) => void;
  onBrowseMore?: () => void;
  showModalHeader?: boolean;
}

type CampaignRequirement = {
  type: string;
  count: number;
  schedule?: string;
  description?: string;
};

function formatRange(startDate?: string, endDate?: string): string {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const startValid = !!start && !Number.isNaN(start.getTime());
  const endValid = !!end && !Number.isNaN(end.getTime());
  if (startValid && endValid)
    return `${SHORT_MONTH_DAY.format(start)} – ${SHORT_MONTH_DAY.format(end)}`;
  if (startValid) return `Starts ${SHORT_MONTH_DAY.format(start)}`;
  return 'TBD';
}

function brandInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'BR';
}

function splitPlatforms(value?: string | null): string[] {
  if (!value) return [];
  return String(value)
    .split(/[,/&|;]+|\band\b/gi)
    .map((s) => s.trim().replace(/_/g, ' '))
    .filter(Boolean);
}

function glyphForRequirementType(type: string): GlyphName {
  const t = String(type || '').toLowerCase();
  if (t.includes('video') || t.includes('reel')) return 'video';
  if (t.includes('story')) return 'igStory';
  if (t.includes('tag') || t.includes('mention') || t.includes('shoutout')) return 'tag';
  if (t.includes('photo') || t.includes('image') || t.includes('post')) return 'igPost';
  return 'igPost';
}

function campaignStatusTone(status: string): keyof KollabTokens['statusChip'] {
  const s = String(status || '').toLowerCase();
  if (s === 'active' || s === 'live') return 'live';
  if (s === 'completed') return 'info';
  return 'neutral';
}

function formatCompactCount(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  return n.toLocaleString('en-IN');
}

export default function CampaignDetailsScreen({
  campaignId,
  onClose,
  onApplySuccess,
}: CampaignDetailsProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    fetchCampaign,
    fetchParticipations,
    fetchMyApplications,
    applications,
    applyToCampaign,
    participations,
    isLoading,
  } = useCampaignStore();
  const fetchProgress = useProgressStore((s) => s.fetchProgress);
  const progressMap = useProgressStore((s) => s.progressData);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFull, setShowFull] = useState<{ desc: boolean; guidelines: boolean }>({
    desc: false,
    guidelines: false,
  });
  const kollab = useKollab();
  const styles = useKollabStyles(kollab);

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

  const tabs = useMemo(() => {
    if (isJoinedEarly) {
      return [{ key: 'progress' as TabKey, label: 'Track Progress' }, ...BASE_TABS];
    }
    return BASE_TABS;
  }, [isJoinedEarly]);

  const [activeTab, setActiveTab] = useState<TabKey>('earnings');
  const didSetJoinedDefaultTab = React.useRef(false);

  useEffect(() => {
    if (isJoinedEarly && !didSetJoinedDefaultTab.current) {
      didSetJoinedDefaultTab.current = true;
      setActiveTab('progress');
    }
    if (!isJoinedEarly) {
      didSetJoinedDefaultTab.current = false;
      if (activeTab === 'progress') setActiveTab('earnings');
    }
  }, [isJoinedEarly, activeTab]);

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
    void load();
  }, [campaignId, fetchCampaign, fetchParticipations, fetchMyApplications]);

  useEffect(() => {
    if (participationEarly?.id) void fetchProgress(String(participationEarly.id));
  }, [participationEarly?.id, fetchProgress]);

  if (loading || isLoading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={kollab.color.ink} />
      </View>
    );
  }
  if (!campaign) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontFamily: font.body, color: kollab.color.ink }}>Campaign not found.</Text>
      </View>
    );
  }

  const participation = participationEarly;
  const applicationStatusNorm = applicationStatusEarly;
  const isJoined = isJoinedEarly;
  const canShowContract = canOpenCampaignContract(participation, applicationEarly);
  const awaitingBrandApproval =
    ['applied', 'pending_review'].includes(applicationStatusNorm) && !participation;
  const isApplicationRejected = applicationStatusNorm === 'rejected';
  const showRejectedReapply = !participation && isApplicationRejected;
  const showFirstTimeApply = !participation && !applicationEarly;
  const approvedButNoParticipationYet = applicationStatusNorm === 'approved' && !participation?.id;
  const progress = participation?.id ? progressMap[String(participation.id)] : undefined;

  const pay = resolveCampaignPaySummary(campaign);
  const fixedPay = Number(campaign.paymentModel?.fixedBasePay);
  const variablePay = Number(campaign.paymentModel?.variablePayRate);
  const hasFixed = Number.isFinite(fixedPay) && fixedPay > 0;
  const hasVariable = Number.isFinite(variablePay) && variablePay > 0;
  const commissionNum = Number(campaign.commissionRate);
  const hasCommission = Number.isFinite(commissionNum) && commissionNum > 0;

  const brandName = campaign.tenant?.tenantName || 'Brand';
  const brandDomain =
    campaign.tenant?.domain || campaign.tenant?.subdomain || campaign.requiredInfluencerNiche || '';
  const dateRange = formatRange(campaign.startDate, campaign.endDate);
  const audience = campaign.targetAudienceAgeGroup
    ? `${String(campaign.targetAudienceAgeGroup).replace(/_/g, ' ')} audience`
    : '';
  const heroMeta = [dateRange, audience].filter(Boolean).join(' · ');
  const platformChips = splitPlatforms(campaign.preferredSocialMedia);

  const handleApply = async () => {
    try {
      const result = await applyToCampaign(campaign.id);
      await fetchParticipations();
      await fetchMyApplications();
      onApplySuccess?.({ id: result.participationId });
      showKollabToast('Application submitted');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to apply for campaign';
      showKollabToast(msg);
    }
  };

  const openContract = () => {
    if (!participation?.id) return;
    onClose?.();
    router.push(`/influencer/contract?participationId=${participation.id}`);
  };

  const openProgress = () => {
    if (!participation?.id) return;
    onClose?.();
    router.push({
      pathname: '/influencer/campaign-progress',
      params: {
        participationId: String(participation.id),
        campaignId: String(participation.campaignId ?? campaign.id),
      },
    } as never);
  };

  const handleJoinPress = () => {
    if (isJoined) {
      openProgress();
      return;
    }
    if (canShowContract) {
      openContract();
      return;
    }
    if (showFirstTimeApply || showRejectedReapply) {
      void handleApply();
      return;
    }
    if (approvedButNoParticipationYet) {
      void (async () => {
        await fetchParticipations();
        await fetchMyApplications();
      })();
    }
  };

  let joinLabel = 'Apply';
  let joinNote = hasCommission
    ? `${commissionNum}% commission · contract required before content goes live`
    : `${pay.primaryLabel} · contract required before content goes live`;
  let joinEnabled = showFirstTimeApply || showRejectedReapply || canShowContract;
  let joinTeal = false;

  if (isJoined) {
    joinLabel = 'View progress';
    joinNote = 'Contract signed · payouts recorded by the brand';
    joinEnabled = true;
    joinTeal = true;
  } else if (canShowContract) {
    joinNote = 'Sign the contract to activate this collab.';
  } else if (awaitingBrandApproval) {
    joinLabel = 'Submitted';
    joinNote = 'Application submitted — waiting for brand approval.';
    joinEnabled = false;
  } else if (approvedButNoParticipationYet) {
    joinLabel = 'Refresh status';
    joinNote = 'Your application was approved. Pull to refresh if this persists.';
    joinEnabled = true;
  } else if (showRejectedReapply) {
    joinNote = 'The brand did not approve this application. You can submit again.';
  } else if (!showFirstTimeApply) {
    joinNote = `Current status: ${participation?.status ?? 'none'}.`;
    joinEnabled = false;
  }

  const renderReadMore = (text: string, field: keyof typeof showFull, limit: number = 180) => {
    if (!text) return null;
    const isLong = text.length > limit;
    const displayText = !isLong || showFull[field] ? text : `${text.slice(0, limit)}...`;
    return (
      <>
        <Text style={styles.bodyCopy}>{displayText}</Text>
        {isLong ? (
          <Pressable onPress={() => setShowFull((s) => ({ ...s, [field]: !s[field] }))}>
            <Text style={styles.readMore}>{showFull[field] ? 'Show less' : 'Read more'}</Text>
          </Pressable>
        ) : null}
      </>
    );
  };

  const summaryPct = progress?.summary.percentage ?? 0;
  const summaryMade = progress?.summary.totalCompleted ?? 0;
  const summaryTotal = progress?.summary.totalRequired ?? 0;
  const doneCount = progress
    ? progress.progress.filter((r) => r.completedCount >= r.requiredCount).length
    : 0;
  const reqCount = progress?.progress.length ?? 0;
  const milestoneFills = [summaryPct > 0, summaryPct >= 50, summaryPct >= 100];
  const milestones = ['Contract signed', 'Content live', 'Payout'] as const;
  const metrics = campaign.metrics;
  const reach = Number(metrics?.totalReach);
  const eng = Number(metrics?.engagementRate);
  const conv = Number(metrics?.conversions);
  const rev = Number(metrics?.revenue);

  const renderProgressTab = () => (
    <View>
      <View style={styles.panelCard}>
        <View style={styles.summaryTopRow}>
          <View style={styles.summaryTopRowBody}>
            <Text style={styles.panelEyebrow}>submitted</Text>
            <Text
              style={styles.panelMetric}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {summaryMade}
              <Text style={styles.panelMetricMuted}> / {summaryTotal}</Text>
            </Text>
            <Text style={styles.panelEyebrow}>
              {doneCount} of {reqCount} deliverables done
            </Text>
          </View>
          <View style={styles.pctPill}>
            <Text style={styles.pctPillText}>{summaryPct}%</Text>
          </View>
        </View>
        <View style={styles.summaryBarTrack}>
          <View style={[styles.summaryBarFill, { width: `${Math.min(100, summaryPct)}%` }]} />
        </View>
        <View style={styles.milestoneRow}>
          {milestones.map((label, index) => {
            const filled = milestoneFills[index];
            return (
              <View key={label} style={styles.milestoneSegment}>
                <View
                  style={[
                    styles.milestoneBar,
                    { backgroundColor: filled ? kollab.color.chartreuse : 'rgba(245,243,237,0.2)' },
                  ]}
                />
                <Text
                  style={[
                    styles.milestoneLabel,
                    { color: filled ? kollab.color.chartreuse : 'rgba(245,243,237,0.45)' },
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.surfaceCard}>
        <Text style={styles.cardTitle}>Collab to date</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>total reach</Text>
            <Text
              style={styles.infoSerif}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.68}
            >
              {Number.isFinite(reach) ? formatCompactCount(reach) : '0'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>engagement</Text>
            <Text
              style={styles.infoSerif}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.68}
            >
              {Number.isFinite(eng) ? `${eng}%` : '0%'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>conversions</Text>
            <Text
              style={styles.infoSerif}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.68}
            >
              {Number.isFinite(conv) ? formatCompactCount(conv) : '0'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>revenue</Text>
            <Text
              style={[styles.infoSerif, { color: kollab.color.violet }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.62}
            >
              {Number.isFinite(rev) ? formatInr(rev) : formatInr(0)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderEarningsTab = () => (
    <View style={styles.surfaceCard}>
      <Text style={styles.cardTitle}>How you earn</Text>
      <View style={styles.limePill}>
        <Text style={styles.limePillText}>{pay.pillLabel}</Text>
      </View>
      <View style={styles.infoGrid}>
        {hasFixed ? (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              {pay.model === 'hybrid' ? 'Fixed base' : 'Fixed pay'}
            </Text>
            <Text
              style={styles.infoValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {formatInr(Math.round(fixedPay))}
            </Text>
          </View>
        ) : null}
        {hasVariable ? (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>
              {pay.model === 'hybrid' ? 'Variable rate' : 'Performance rate'}
            </Text>
            <Text
              style={styles.infoValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {variablePay <= 100
                ? `${Number.isInteger(variablePay) ? variablePay : variablePay.toFixed(1)}%`
                : formatInr(Math.round(variablePay))}
            </Text>
          </View>
        ) : null}
        {!hasFixed && !hasVariable && hasCommission ? (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Performance rate</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {commissionNum}%
            </Text>
          </View>
        ) : null}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Revenue to date</Text>
          <Text
            style={styles.infoValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {Number.isFinite(rev) ? formatInr(rev) : formatInr(0)}
          </Text>
        </View>
      </View>
      <Text style={styles.payHint}>
        {pay.model === 'fixed'
          ? 'You earn a fixed amount for completing this campaign’s deliverables.'
          : pay.model === 'performance'
            ? 'Pay depends on results — tracked sales and conversions against your commission rate.'
            : pay.model === 'hybrid'
              ? 'You get a fixed base plus a performance-based variable portion.'
              : 'Final pay terms are confirmed in the campaign contract.'}
      </Text>
    </View>
  );

  const renderDetailsTab = () => {
    const hasDescription = Boolean(campaign.description?.trim());
    const hasGuidelines = Boolean(campaign.basicGuidelines?.trim());

    return (
      <View style={{ gap: 12 }}>
        <View style={styles.surfaceCard}>
          <Text style={styles.cardTitle}>Collab timeline</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Runs</Text>
              <Text
                style={styles.infoValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {dateRange}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Audience</Text>
              <Text
                style={styles.infoValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {campaign.targetAudienceAgeGroup
                  ? String(campaign.targetAudienceAgeGroup).replace(/_/g, ' ')
                  : '—'}
              </Text>
            </View>
          </View>
          <View style={styles.cardDivider} />
          <Text style={styles.cardSectionLabel}>Preferred platform</Text>
          {platformChips.length > 0 ? (
            <View style={styles.platformChipRow}>
              {platformChips.map((label, idx) => (
                <View key={`${label}-${idx}`} style={styles.platformChip}>
                  <Text style={styles.platformChipText}>{label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.bodyCopy}>{campaign.preferredSocialMedia || '—'}</Text>
          )}
        </View>

        {hasDescription || hasGuidelines ? (
          <View style={styles.surfaceCard}>
            <Text style={styles.cardTitle}>Brief</Text>
            {hasDescription ? (
              <>
                <Text style={styles.cardSectionLabel}>Description</Text>
                {renderReadMore(campaign.description, 'desc', 180)}
              </>
            ) : null}
            {hasDescription && hasGuidelines ? <View style={styles.cardDivider} /> : null}
            {hasGuidelines ? (
              <>
                <Text
                  style={[
                    styles.cardSectionLabel,
                    hasDescription ? styles.cardSectionLabelSpaced : null,
                  ]}
                >
                  Guidelines
                </Text>
                {renderReadMore(campaign.basicGuidelines, 'guidelines', 180)}
              </>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  const requirements = campaign.contentRequirements ?? [];
  const renderDeliverablesTab = () =>
    requirements.length > 0 ? (
      <View style={styles.surfaceCard}>
        <Text style={styles.cardTitle}>Content requirements</Text>
        {requirements.map((req: CampaignRequirement, index: number) => (
          <View
            key={`${req.type}-${index}`}
            style={[
              styles.requirementItem,
              index === requirements.length - 1 ? { borderBottomWidth: 0 } : null,
            ]}
          >
            <View style={styles.requirementIconTile}>
              <Glyph
                name={glyphForRequirementType(req.type)}
                size={17}
                color={kollab.color.inkOn}
              />
            </View>
            <View style={styles.requirementBody}>
              <Text style={styles.requirementTitle}>
                ×{req.count} {String(req.type).replace(/_/g, ' ')}
                {req.schedule ? (
                  <Text style={styles.requirementSchedule}> ({req.schedule})</Text>
                ) : null}
              </Text>
              {req.description ? (
                <Text style={styles.requirementText}>{req.description}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    ) : (
      <View style={styles.surfaceCard}>
        <Text style={styles.bodyCopy}>No content requirements listed yet.</Text>
      </View>
    );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 200 }}
      >
        <View style={[styles.detailHead, { paddingTop: Math.max(insets.top + 8, 16) }]}>
          {onClose ? (
            <Pressable
              onPress={onClose}
              style={styles.heroBackButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Text style={styles.heroBackGlyph}>←</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.heroBody}>
          <View style={styles.brandHeroRow}>
            {campaign.brandLogoUrl ? (
              <View style={styles.brandLogoWell}>
                <Image
                  source={{ uri: campaign.brandLogoUrl }}
                  style={styles.brandLogo}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={[styles.brandLogoWell, styles.brandLogoFallback]}>
                <Text style={styles.brandInitials}>{brandInitials(brandName)}</Text>
              </View>
            )}
            <View style={styles.brandHeroCopy}>
              <Text style={styles.brandHeroName} numberOfLines={1}>
                {brandName}
              </Text>
              {brandDomain ? <Text style={styles.brandDomain}>{brandDomain}</Text> : null}
            </View>
            <KollabStatusChip
              tone={campaignStatusTone(campaign.status)}
              label={String(campaign.status || 'active')}
            />
          </View>
          <Text style={styles.campaignName}>{formatCampaignDisplayName(campaign.name)}</Text>
          {heroMeta ? <Text style={styles.heroMeta}>{heroMeta}</Text> : null}
        </View>

        <View style={styles.tabRowWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.tabRow}
          >
            {tabs.map((tab) => {
              const active = tab.key === activeTab;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={styles.tabBtn}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        fontFamily: active ? font.bold : font.semiBold,
                        color: active ? kollab.color.ink : kollab.color.inkMuted,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      styles.tabIndicator,
                      { backgroundColor: active ? kollab.color.violet : 'transparent' },
                    ]}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.tabBody}>
          {activeTab === 'progress' ? renderProgressTab() : null}
          {activeTab === 'earnings' ? renderEarningsTab() : null}
          {activeTab === 'details' ? renderDetailsTab() : null}
          {activeTab === 'deliverables' ? renderDeliverablesTab() : null}
        </View>
      </ScrollView>

      <View style={[styles.bottomDock, { paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>
        <LinearGradient
          colors={[`${kollab.color.screen}00`, kollab.color.screen]}
          style={styles.bottomFade}
          pointerEvents="none"
        />
        {awaitingBrandApproval ? null : joinTeal ? (
          <Pressable
            onPress={handleJoinPress}
            disabled={!joinEnabled}
            style={[styles.tealCta, { opacity: joinEnabled ? 1 : 0.5 }]}
            accessibilityRole="button"
            accessibilityLabel={joinLabel}
          >
            <Text style={styles.tealCtaText}>{joinLabel}</Text>
          </Pressable>
        ) : (
          <KollabButton label={joinLabel} onPress={handleJoinPress} disabled={!joinEnabled} />
        )}
        <Text style={[styles.joinNote, awaitingBrandApproval ? styles.joinNoteSolo : null]}>
          {joinNote}
        </Text>
      </View>
    </View>
  );
}

function useKollabStyles(kollab: KollabTokens) {
  return useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: kollab.color.screen,
        },
        scroll: { flex: 1 },
        detailHead: {
          paddingHorizontal: 18,
          paddingBottom: 10,
        },
        heroBackButton: {
          width: 38,
          height: 38,
          borderRadius: 99,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: kollab.color.well,
        },
        heroBackGlyph: {
          fontSize: 17,
          color: kollab.color.ink,
          lineHeight: 20,
        },
        heroBody: {
          paddingHorizontal: 24,
        },
        brandHeroRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        brandLogoWell: {
          width: 40,
          height: 40,
          borderRadius: 13,
          overflow: 'hidden',
          backgroundColor: kollab.color.panel,
          alignItems: 'center',
          justifyContent: 'center',
        },
        brandLogoFallback: {
          backgroundColor: kollab.color.panel,
        },
        brandLogo: {
          width: '100%',
          height: '100%',
        },
        brandInitials: {
          fontFamily: font.bold,
          fontSize: 13,
          color: kollab.color.inkOn,
        },
        brandHeroCopy: {
          flex: 1,
          minWidth: 0,
        },
        brandHeroName: {
          fontSize: 13.5,
          fontFamily: font.semiBold,
          color: kollab.color.ink,
        },
        brandDomain: {
          fontSize: 11.5,
          fontFamily: font.body,
          color: kollab.color.ink,
          opacity: 0.55,
        },
        campaignName: {
          fontSize: 31,
          lineHeight: 33,
          fontFamily: font.display,
          color: kollab.color.ink,
          letterSpacing: -0.5,
          marginTop: 14,
          marginBottom: 5,
        },
        heroMeta: {
          fontSize: 12.5,
          fontFamily: font.body,
          color: kollab.color.ink,
          opacity: 0.55,
        },
        tabRowWrap: {
          marginTop: 18,
          borderBottomWidth: 1,
          borderBottomColor: kollab.color.rule,
        },
        tabRow: {
          flexDirection: 'row',
          gap: 2,
          paddingHorizontal: 18,
        },
        tabBtn: {
          flexGrow: 0,
          alignItems: 'center',
          paddingTop: 10,
          paddingHorizontal: 10,
          gap: 9,
        },
        tabLabel: {
          fontSize: 13,
        },
        tabIndicator: {
          width: '72%',
          height: 2,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
        },
        tabBody: {
          paddingHorizontal: 24,
          paddingTop: 16,
          gap: 12,
        },
        panelCard: {
          backgroundColor: kollab.color.panel,
          borderRadius: 24,
          padding: 22,
          marginBottom: 12,
        },
        summaryTopRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
        },
        summaryTopRowBody: { flex: 1, minWidth: 0 },
        panelEyebrow: {
          fontFamily: font.body,
          fontSize: 12,
          color: kollab.color.panelInk,
          opacity: 0.6,
        },
        panelMetric: {
          fontFamily: font.display,
          fontSize: 38,
          color: kollab.color.panelInk,
          marginVertical: 2,
          minWidth: 0,
          flexShrink: 1,
        },
        panelMetricMuted: {
          fontFamily: font.display,
          fontSize: 24,
          color: kollab.color.panelInk,
          opacity: 0.5,
        },
        pctPill: {
          backgroundColor: kollab.color.chartreuse,
          borderRadius: 999,
          paddingHorizontal: 15,
          paddingVertical: 9,
          flexShrink: 0,
        },
        pctPillText: {
          fontFamily: font.display,
          fontSize: 17,
          color: kollab.color.onChartreuse,
        },
        summaryBarTrack: {
          height: 7,
          borderRadius: 99,
          backgroundColor: 'rgba(245,243,237,0.18)',
          overflow: 'hidden',
          marginTop: 16,
        },
        summaryBarFill: {
          height: '100%',
          borderRadius: 99,
          backgroundColor: kollab.color.chartreuse,
        },
        milestoneRow: {
          flexDirection: 'row',
          gap: 6,
          marginTop: 14,
        },
        milestoneSegment: { flex: 1 },
        milestoneBar: {
          height: 5,
          borderRadius: 99,
        },
        milestoneLabel: {
          fontFamily: font.semiBold,
          fontSize: 10,
          marginTop: 5,
        },
        surfaceCard: {
          backgroundColor: kollab.color.card,
          borderRadius: 22,
          padding: 18,
          marginBottom: 12,
          ...kollab.shadow.card,
        },
        cardTitle: {
          ...kType.sectionTitle,
          color: kollab.color.ink,
          marginBottom: 12,
        },
        cardSectionLabel: {
          fontFamily: font.semiBold,
          fontSize: 12,
          color: kollab.color.inkMuted,
          marginBottom: 8,
        },
        cardSectionLabelSpaced: {
          marginTop: 2,
        },
        cardDivider: {
          height: 1,
          backgroundColor: kollab.color.hairline,
          marginVertical: 14,
        },
        limePill: {
          alignSelf: 'flex-start',
          backgroundColor: kollab.color.chartreuse,
          borderRadius: 999,
          paddingHorizontal: 13,
          paddingVertical: 6,
          marginBottom: 16,
        },
        limePillText: {
          fontFamily: font.bold,
          fontSize: 12,
          color: kollab.color.onChartreuse,
        },
        payHint: {
          marginTop: 14,
          fontSize: 12.5,
          lineHeight: 19,
          color: kollab.color.inkMuted,
          fontFamily: font.body,
        },
        infoGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
        },
        infoItem: {
          flexGrow: 1,
          flexBasis: '42%',
          minWidth: 0,
        },
        infoLabel: {
          color: kollab.color.inkMuted,
          fontSize: 11.5,
          fontFamily: font.body,
        },
        infoValue: {
          color: kollab.color.ink,
          fontSize: 15,
          fontFamily: font.bold,
          marginTop: 3,
          minWidth: 0,
        },
        infoSerif: {
          color: kollab.color.ink,
          fontSize: 25,
          fontFamily: font.display,
          marginTop: 2,
          minWidth: 0,
        },
        bodyCopy: {
          fontSize: 13.5,
          color: kollab.color.ink,
          lineHeight: 21,
          fontFamily: font.body,
        },
        platformChipRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 7,
        },
        platformChip: {
          backgroundColor: kollab.color.neutralChipBg,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
        platformChipText: {
          fontSize: 12.5,
          fontFamily: font.semiBold,
          color: kollab.color.ink,
        },
        requirementItem: {
          paddingVertical: 13,
          flexDirection: 'row',
          gap: 12,
          alignItems: 'flex-start',
          borderBottomWidth: 1,
          borderBottomColor: kollab.color.hairline,
        },
        requirementIconTile: {
          width: 34,
          height: 34,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: kollab.color.violet,
        },
        requirementBody: { flex: 1, minWidth: 0 },
        requirementTitle: {
          fontSize: 13.5,
          fontFamily: font.semiBold,
          color: kollab.color.ink,
        },
        requirementSchedule: {
          fontFamily: font.body,
          opacity: 0.55,
        },
        requirementText: {
          fontSize: 12,
          color: kollab.color.ink,
          opacity: 0.55,
          lineHeight: 17,
          fontFamily: font.body,
          marginTop: 3,
        },
        readMore: {
          color: kollab.color.violetDeep,
          fontFamily: font.semiBold,
          fontSize: 13,
          marginTop: 4,
        },
        bottomDock: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 24,
          paddingTop: 20,
        },
        bottomFade: {
          position: 'absolute',
          left: 0,
          right: 0,
          top: -36,
          height: 36,
        },
        tealCta: {
          borderRadius: 999,
          paddingVertical: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: kollab.color.tealTint,
          shadowColor: kollab.color.shadowColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.16,
          shadowRadius: 24,
          elevation: 6,
        },
        tealCtaText: {
          fontFamily: font.semiBold,
          fontSize: 16,
          color: kollab.color.teal,
        },
        joinNote: {
          textAlign: 'center',
          fontSize: 12,
          fontFamily: font.body,
          color: kollab.color.ink,
          opacity: 0.62,
          marginTop: 10,
        },
        joinNoteSolo: {
          marginTop: 0,
        },
      }),
    [kollab]
  );
}
