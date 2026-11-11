import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useCampaignStore, type Campaign } from '../../../../store/campaign-store';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTabPressScrollTop } from '@/lib/use-tab-press-scroll-top';
import {
  PhotoCard,
  KollabScreenHeader,
  ScrollScreen,
  KollabButton,
  KollabSectionLabel,
  KollabSegmented,
  KollabEmptyCard,
  KollabTextField,
} from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { CampaignDetailsModal } from '@/components/influencer/CampaignDetailsModal';
import { resolveCampaignPaySummary } from '@/lib/campaign-pay-summary';
import { campaignCoverSource, ugcCoverSource } from '@/lib/campaign-cover';
import { buildMineCampaignStatus } from '@/lib/opportunity-card-ui';
import { formatInr } from '@/lib/currency';
import {
  appFromRow,
  applicationStatusShort,
  canDeliverContent,
  useUgcStore,
  type UgcApplicationRow,
} from '@/store/ugc-store';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';
import {
  isParticipationEnrolled,
  applicationCampaignId,
  isPendingCollabActivity,
} from '@/lib/campaign-participation-ui';

type CollabSegment = 'exclusive' | 'public' | 'mine';

const SEGMENTS = [
  { key: 'exclusive', label: 'Exclusive' },
  { key: 'public', label: 'Public' },
  { key: 'mine', label: 'My Collab' },
] as const;

const SHORT_MONTH_DAY = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function formatRange(startDate?: string, endDate?: string) {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const startValid = !!start && !Number.isNaN(start.getTime());
  const endValid = !!end && !Number.isNaN(end.getTime());
  if (startValid && endValid)
    return `${SHORT_MONTH_DAY.format(start)} – ${SHORT_MONTH_DAY.format(end)}`;
  if (startValid) return `Starts ${SHORT_MONTH_DAY.format(start)}`;
  return 'TBD';
}

function buildMeta(campaign: Campaign): string {
  const niche = campaign.requiredInfluencerNiche
    ? String(campaign.requiredInfluencerNiche).replace(/_/g, ' ')
    : 'General';
  const nicheLabel = niche.charAt(0).toUpperCase() + niche.slice(1);
  const range = formatRange(campaign.startDate, campaign.endDate ?? undefined);
  return range !== 'TBD' ? `${nicheLabel} · ${range}` : nicheLabel;
}

function brandInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'B';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function relativeWhen(iso: string | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function headerSubtitle(segment: CollabSegment): string {
  if (segment === 'public') return 'UGC briefs and public opportunities';
  if (segment === 'mine') return 'Activity and approved work';
  return 'Exclusive brand collaborations';
}

function parseSegment(raw: string | undefined): CollabSegment | null {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (s === 'public' || s === 'mine' || s === 'exclusive') return s;
  return null;
}

function ugcBriefId(job: Record<string, unknown>): string {
  return String(job.id ?? job.briefId ?? '').trim();
}

function ugcBriefTitle(job: Record<string, unknown>): string {
  return String(job.title ?? job.name ?? 'UGC brief');
}

function ugcBriefPay(job: Record<string, unknown>): string | undefined {
  const flat = Number(job.flatFee ?? job.budget ?? job.payAmount ?? NaN);
  if (Number.isFinite(flat) && flat > 0) return formatInr(flat);
  const rate = Number(job.rate ?? NaN);
  if (Number.isFinite(rate) && rate > 0) return formatInr(rate);
  return undefined;
}

function ugcBriefMeta(job: Record<string, unknown>): string {
  const niche = String(job.niche ?? job.category ?? '')
    .replace(/_/g, ' ')
    .trim();
  const content = String(job.contentType ?? job.type ?? '')
    .replace(/_/g, ' ')
    .trim();
  const parts = [niche, content].filter(Boolean);
  return parts.length > 0
    ? parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' · ')
    : 'Open brief';
}

export default function CampaignsScreen() {
  const kollab = useKollab();
  const router = useRouter();
  const params = useLocalSearchParams<{ segment?: string }>();
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
  const {
    jobs: allUgcJobs,
    applications: ugcApplications,
    loading: ugcLoading,
    error: ugcError,
    fetchJobs,
    fetchApplications,
  } = useUgcStore();
  // A brief the creator has already applied to belongs under My Collab, not in the public list.
  const ugcJobs = useMemo(() => allUgcJobs.filter((job) => job.hasApplied !== true), [allUgcJobs]);

  const [segment, setSegment] = useState<CollabSegment>(
    () => parseSegment(params.segment) ?? 'exclusive'
  );
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  useEffect(() => {
    const next = parseSegment(params.segment);
    if (next) setSegment(next);
  }, [params.segment]);

  useFocusEffect(
    useCallback(() => {
      void fetchCampaigns();
      void fetchParticipations();
      void fetchMyApplications();
      if (segment === 'public') void fetchJobs();
      void fetchApplications();
    }, [
      fetchCampaigns,
      fetchParticipations,
      fetchMyApplications,
      fetchJobs,
      fetchApplications,
      segment,
    ])
  );

  const takenCampaignIds = useMemo(() => {
    const ids = new Set<string>();
    const names = new Set<string>();
    for (const p of participations) {
      const id = String(p.campaignId ?? p.campaign?.id ?? '')
        .trim()
        .toLowerCase();
      if (id) ids.add(id);
      const n = String(p.campaign?.name ?? '')
        .trim()
        .toLowerCase();
      if (n) names.add(n);
    }
    for (const a of applications) {
      const st = String(a.status ?? '')
        .trim()
        .toLowerCase();
      if (st === 'rejected') continue;
      const id = applicationCampaignId(a);
      if (id) ids.add(id);
      const nestedName = String(a.campaign?.name ?? '')
        .trim()
        .toLowerCase();
      if (nestedName) names.add(nestedName);
      const listed = campaigns.find((c) => String(c.id).trim().toLowerCase() === id);
      const listedName = String(listed?.name ?? '')
        .trim()
        .toLowerCase();
      if (listedName) names.add(listedName);
    }
    return { ids, names };
  }, [applications, campaigns, participations]);

  const exclusiveList = useMemo(
    () =>
      campaigns.filter((c) => {
        const id = String(c.id ?? '')
          .trim()
          .toLowerCase();
        if (!id) return false;
        if (String(c.status ?? '').toLowerCase() !== 'active') return false;
        const name = String(c.name ?? '')
          .trim()
          .toLowerCase();
        if (takenCampaignIds.ids.has(id)) return false;
        if (name && takenCampaignIds.names.has(name)) return false;
        return true;
      }),
    [campaigns, takenCampaignIds]
  );

  const enrolledIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of participations) {
      const id = String(p.campaignId ?? p.campaign?.id ?? '')
        .trim()
        .toLowerCase();
      if (id && isParticipationEnrolled(p)) ids.add(id);
    }
    for (const a of applications) {
      const id = String(a.campaignId ?? a.campaign?.id ?? '')
        .trim()
        .toLowerCase();
      const p = participations.find((row) => {
        const pid = String(row.campaignId ?? row.campaign?.id ?? '')
          .trim()
          .toLowerCase();
        return pid === id;
      });
      if (id && isParticipationEnrolled(p, a.status)) ids.add(id);
    }
    return ids;
  }, [participations, applications]);

  const mineList = useMemo(() => {
    return campaigns.filter((c) => {
      const id = String(c.id ?? '')
        .trim()
        .toLowerCase();
      return Boolean(id) && enrolledIds.has(id);
    });
  }, [campaigns, enrolledIds]);

  const activityItems = useMemo(() => {
    return applications
      .filter((a) => {
        const cid = applicationCampaignId(a);
        if (!cid) return false;
        const p = participations.find((row) => {
          const pid = String(row.campaignId ?? row.campaign?.id ?? '')
            .trim()
            .toLowerCase();
          return pid === cid;
        });
        return isPendingCollabActivity(a, p);
      })
      .slice()
      .sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime())
      .map((a) => {
        const campaignId = applicationCampaignId(a);
        const campaign =
          a.campaign ||
          campaigns.find((c) => String(c.id).trim().toLowerCase() === campaignId) ||
          null;
        const st = String(a.status ?? 'applied')
          .trim()
          .toLowerCase();
        const leftCollab = participations.some(
          (row) =>
            String(row.campaignId ?? row.campaign?.id ?? '').trim().toLowerCase() === campaignId &&
            String(row.status ?? '').trim().toLowerCase() === 'withdrawn'
        );
        const statusLabel = leftCollab
          ? 'Withdrawn'
          : st === 'applied' || st === 'pending_review' || st === 'pending'
            ? 'Submitted'
            : a.status;
        const s = String(statusLabel).toLowerCase();
        const dot =
          s.includes('pending') || s.includes('submitted') || s.includes('applied')
            ? kollab.color.heat
            : kollab.color.inkMuted;
        return {
          campaignId,
          name: campaign?.name || 'Campaign',
          niche: campaign?.requiredInfluencerNiche || campaign?.type || null,
          cover: campaignCoverSource(campaign),
          status: statusLabel,
          when: relativeWhen(a.appliedAt),
          dot,
        };
      });
  }, [applications, participations, campaigns, kollab.color.heat, kollab.color.inkMuted]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const tasks: Promise<unknown>[] = [
        fetchCampaigns(),
        fetchParticipations(),
        fetchMyApplications(),
      ];
      if (segment === 'public') tasks.push(fetchJobs());
      tasks.push(fetchApplications());
      await Promise.all(tasks);
    } catch {
      /* keep last list */
    } finally {
      setRefreshing(false);
    }
  };

  const tabScroll = useTabPressScrollTop(() => void onRefresh());

  // Search filters whichever list is showing, by name, brand or niche. It resets when you leave the tab segment.
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const matches = (...parts: Array<unknown>) => !q || parts.some((p) => String(p ?? '').toLowerCase().includes(q));
  const exclusiveShown = exclusiveList.filter((c) => matches(c.name, c.requiredInfluencerNiche, c.type));
  const mineShown = mineList.filter((c) => matches(c.name, c.requiredInfluencerNiche, c.type));
  const activityShown = activityItems.filter((a) => matches(a.name, a.niche));
  const ugcShown = ugcJobs.filter((j) => matches(ugcBriefTitle(j as Record<string, unknown>), (j as Record<string, unknown>).brandName, (j as Record<string, unknown>).category));
  const shownCount =
    segment === 'exclusive' ? exclusiveShown.length : segment === 'public' ? ugcShown.length : mineShown.length + activityShown.length;

  const statusFor = (campaign: Campaign) => {
    const cid = String(campaign.id);
    const mine = buildMineCampaignStatus(cid, participations, applications);
    const toneKey: keyof KollabTokens['statusChip'] =
      mine.tone === 'active' || mine.tone === 'success'
        ? 'live'
        : mine.tone === 'pending' || mine.tone === 'warning'
          ? 'warn'
          : mine.tone === 'review'
            ? 'info'
            : 'neutral';
    return { label: mine.label || 'Active', tone: toneKey };
  };

  const subtitle = headerSubtitle(segment);
  const liveChip = kollab.statusChip.live;

  const renderExclusive = () => {
    if (isLoading && exclusiveShown.length === 0) {
      return <ActivityIndicator size="large" color={kollab.color.ink} style={{ marginTop: 40 }} />;
    }
    if (exclusiveShown.length === 0) {
      return (
        <KollabEmptyCard
          title="No exclusive collabs"
          subtitle="New brand collaborations show up here. You can also browse Fresh collabs on Home."
          ctaLabel="Browse fresh collabs"
          onPress={() => router.push('/influencer/dashboard' as never)}
        />
      );
    }
    return (
      <View style={styles.feed}>
        {exclusiveShown.map((campaign) => {
          const cid = String(campaign.id);
          const pay = resolveCampaignPaySummary(campaign);
          const brand = String(campaign.tenant?.tenantName || 'Brand');
          return (
            <PhotoCard
              key={cid}
              cover={campaignCoverSource(campaign)}
              title={String(campaign.name || 'Untitled')}
              meta={buildMeta(campaign)}
              payLabel={pay.primaryLabel}
              brand={{ logo: brandInitials(brand), logoBg: kollab.color.panel, brand }}
              status={{ label: 'Active', bg: liveChip.bg, fg: liveChip.fg }}
              onPress={() => setSelectedCampaignId(cid)}
            />
          );
        })}
      </View>
    );
  };

  /** One UGC brief the creator applied to: it stays here through accepted, delivered, approved and paid. */
  const renderUgcApplication = (row: UgcApplicationRow) => {
    const app = appFromRow(row);
    const brief = row.brief ?? {};
    const briefId = ugcBriefId(brief);
    if (!briefId) return null;
    const status = String(app.status ?? '').toLowerCase();
    const needsAction = canDeliverContent(row);
    const chip =
      status === 'rejected'
        ? kollab.statusChip.neutral
        : needsAction
          ? kollab.statusChip.live
          : status === 'pending'
            ? kollab.statusChip.warn
            : kollab.statusChip.info;
    return (
      <PhotoCard
        key={app.id || briefId}
        cover={ugcCoverSource(brief)}
        title={ugcBriefTitle(brief)}
        meta={needsAction ? 'Ready for your content' : ugcBriefMeta(brief)}
        payLabel={ugcBriefPay(brief)}
        status={{ label: applicationStatusShort(row), bg: chip.bg, fg: chip.fg }}
        onPress={() =>
          router.push(`/influencer/ugc-brief-detail?id=${encodeURIComponent(briefId)}` as never)
        }
      />
    );
  };

  const renderPublic = () => {
    if (ugcLoading && ugcShown.length === 0) {
      return <ActivityIndicator size="large" color={kollab.color.ink} style={{ marginTop: 40 }} />;
    }
    if (ugcShown.length === 0) {
      return (
        <KollabEmptyCard
          title="No public briefs"
          subtitle="Open UGC opportunities from brands will appear here when available."
          ctaLabel="Browse fresh collabs"
          onPress={() => router.push('/influencer/dashboard' as never)}
        />
      );
    }
    return (
      <View style={styles.feed}>
        {ugcShown.map((job) => {
          const id = ugcBriefId(job);
          if (!id) return null;
          return (
            <PhotoCard
              key={id}
              cover={ugcCoverSource(job)}
              title={ugcBriefTitle(job)}
              meta={ugcBriefMeta(job)}
              payLabel={ugcBriefPay(job)}
              status={{ label: 'Open', bg: liveChip.bg, fg: liveChip.fg }}
              onPress={() =>
                router.push(`/influencer/ugc-brief-detail?id=${encodeURIComponent(id)}` as never)
              }
            />
          );
        })}
      </View>
    );
  };

  const renderMine = () => {
    if (
      isLoading &&
      mineShown.length === 0 &&
      activityShown.length === 0 &&
      ugcApplications.length === 0
    ) {
      return <ActivityIndicator size="large" color={kollab.color.ink} style={{ marginTop: 40 }} />;
    }
    if (mineShown.length === 0 && activityShown.length === 0 && ugcApplications.length === 0) {
      return (
        <KollabEmptyCard
          title="No collabs yet"
          subtitle="Submitted applications and approved collabs land here. Apply from Fresh collabs on Home."
          ctaLabel="Browse fresh collabs"
          onPress={() => router.push('/influencer/dashboard' as never)}
        />
      );
    }
    return (
      <View style={styles.feed}>
        {activityShown.length > 0 ? (
          <View style={styles.activityBlock}>
            <KollabSectionLabel label="collab activity" />
            {activityShown.map((item) => (
              <Pressable
                key={item.campaignId}
                onPress={() => setSelectedCampaignId(item.campaignId)}
                style={[
                  styles.activityRow,
                  { backgroundColor: kollab.color.card },
                  kollab.shadow.card,
                ]}
              >
                <View style={[styles.activityThumb, { backgroundColor: kollab.color.imgBg }]}>
                  <Image
                    source={item.cover}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: item.dot }]} />
                    <Text style={[styles.statusText, { color: item.dot }]} numberOfLines={1}>
                      {item.status}
                    </Text>
                    {item.when ? (
                      <Text style={[styles.whenText, { color: kollab.color.ink }]}>
                        {item.when}
                      </Text>
                    ) : null}
                  </View>
                  <Text
                    style={[styles.activityName, { color: kollab.color.ink }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {item.niche ? (
                    <Text
                      style={[styles.activityMeta, { color: kollab.color.ink }]}
                      numberOfLines={1}
                    >
                      {item.niche}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {ugcApplications.length > 0 ? (
          <View style={styles.activityBlock}>
            <KollabSectionLabel label="ugc briefs" />
            {ugcApplications.map((row) => renderUgcApplication(row))}
          </View>
        ) : null}

        {mineShown.length > 0 && (activityShown.length > 0 || ugcApplications.length > 0) ? (
          <KollabSectionLabel label="approved" />
        ) : null}

        {mineShown.map((campaign) => {
          const cid = String(campaign.id);
          const pay = resolveCampaignPaySummary(campaign);
          const brand = String(campaign.tenant?.tenantName || 'Brand');
          const st = statusFor(campaign);
          const chip = kollab.statusChip[st.tone];
          return (
            <PhotoCard
              key={cid}
              cover={campaignCoverSource(campaign)}
              title={String(campaign.name || 'Untitled')}
              meta={buildMeta(campaign)}
              payLabel={pay.primaryLabel}
              brand={{ logo: brandInitials(brand), logoBg: kollab.color.panel, brand }}
              status={{ label: st.label, bg: chip.bg, fg: chip.fg }}
              onPress={() => setSelectedCampaignId(cid)}
            />
          );
        })}

        {mineShown.length > 0 ? (
          <Text style={[styles.endCaption, { color: kollab.color.ink }]}>That&apos;s all for now</Text>
        ) : null}

        <View style={[styles.freshCard, { borderColor: kollab.color.outline }]}>
          <Text style={[styles.freshTitle, { color: kollab.color.ink }]}>
            Looking for more work?
          </Text>
          <Text style={[styles.freshMeta, { color: kollab.color.ink }]}>
            Browse open campaigns on Fresh collabs
          </Text>
          <KollabButton
            label="Browse fresh collabs"
            variant="ink"
            onPress={() => router.push('/influencer/dashboard' as never)}
            style={styles.browseBtn}
          />
        </View>
      </View>
    );
  };

  const displayError = segment === 'public' ? ugcError : error;

  return (
    <ScrollScreen
      padH={0}
      contentInsetBottom
      scrollRef={tabScroll.scrollRef}
      scrollProps={{
        ...tabScroll.scrollProps,
        refreshControl: (
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        ),
        contentContainerStyle: { flexGrow: 1, paddingBottom: 150 },
      }}
    >
      <View style={styles.head}>
        <KollabScreenHeader title="Collabs" subtitle={subtitle} showBack={false} size="tab" />
        <KollabSegmented
          segments={[...SEGMENTS]}
          value={segment}
          onChange={(key) => setSegment(key as CollabSegment)}
          style={styles.segments}
        />
        <View style={styles.searchWrap}>
          <KollabTextField
            placeholder={segment === 'public' ? 'Search UGC briefs' : 'Search collabs'}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search collabs"
            style={styles.searchInput}
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={10}
              style={styles.searchClear}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={20} color={kollab.color.inkMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {displayError ? (
        <Text style={[styles.error, { color: kollab.color.heat }]}>{displayError}</Text>
      ) : null}

      {q && shownCount === 0 ? (
        <Text style={[styles.noMatches, { color: kollab.color.inkMuted }]}>No results for “{query.trim()}”</Text>
      ) : segment === 'exclusive' ? (
        renderExclusive()
      ) : segment === 'public' ? (
        renderPublic()
      ) : (
        renderMine()
      )}

      <CampaignDetailsModal
        campaignId={selectedCampaignId}
        onClose={() => {
          setSelectedCampaignId(null);
          void fetchParticipations();
          void fetchMyApplications();
        }}
        onBrowseMore={() => {
          void fetchParticipations();
          void fetchMyApplications();
        }}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  head: {
    paddingHorizontal: 22,
    paddingTop: 2,
  },
  segments: {
    marginTop: 12,
    marginBottom: 8,
  },
  searchWrap: {
    marginBottom: 8,
    justifyContent: 'center',
  },
  searchInput: {
    paddingRight: 44,
  },
  searchClear: {
    position: 'absolute',
    right: 14,
  },
  noMatches: {
    fontFamily: font.body,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 22,
    paddingVertical: 32,
  },
  error: {
    fontFamily: font.body,
    fontSize: 13,
    paddingHorizontal: 22,
    marginBottom: 8,
  },
  feed: {
    paddingHorizontal: 30,
    gap: 14,
  },
  activityBlock: {
    gap: 9,
    marginBottom: 4,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    paddingVertical: 11,
    paddingRight: 14,
    paddingLeft: 11,
  },
  activityThumb: {
    width: 52,
    height: 52,
    borderRadius: 15,
    overflow: 'hidden',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
  },
  statusText: {
    fontFamily: font.semiBold,
    fontSize: 10,
    letterSpacing: 0.2,
    textTransform: 'capitalize',
    flexShrink: 1,
  },
  whenText: {
    fontFamily: font.body,
    fontSize: 10,
    opacity: 0.35,
    marginLeft: 'auto',
  },
  activityName: {
    ...kType.rowTitle,
    marginTop: 4,
  },
  activityMeta: {
    fontFamily: font.body,
    fontSize: 11.5,
    opacity: 0.55,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  endCaption: {
    fontFamily: font.body,
    fontSize: 13,
    opacity: 0.55,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  freshCard: {
    borderRadius: 26,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 4,
  },
  freshTitle: {
    ...kType.sectionTitle,
    textAlign: 'center',
  },
  freshMeta: {
    fontFamily: font.body,
    fontSize: 13,
    opacity: 0.55,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  browseBtn: {
    alignSelf: 'stretch',
  },
});
