import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useCampaignStore, type Campaign } from '../../../../store/campaign-store';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  PhotoCard,
  KollabScreenHeader,
  ScrollScreen,
  KollabButton,
  KollabSectionLabel,
} from '@/components/ui';
import { CampaignDetailsModal } from '@/components/influencer/CampaignDetailsModal';
import { resolveCampaignPaySummary } from '@/lib/campaign-pay-summary';
import { nicheCoverSource } from '@/lib/niche-cover';
import { buildMineCampaignStatus } from '@/lib/opportunity-card-ui';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';
import {
  isParticipationEnrolled,
  applicationCampaignId,
  isPendingCollabActivity,
} from '@/lib/campaign-participation-ui';

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

export default function CampaignsScreen() {
  const kollab = useKollab();
  const router = useRouter();
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

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void fetchCampaigns();
      void fetchParticipations();
      void fetchMyApplications();
    }, [fetchCampaigns, fetchParticipations, fetchMyApplications])
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

  const list = useMemo(() => {
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
        const statusLabel =
          st === 'applied' || st === 'pending_review' || st === 'pending' ? 'Submitted' : a.status;
        const s = String(statusLabel).toLowerCase();
        const dot =
          s.includes('pending') || s.includes('submitted') || s.includes('applied')
            ? kollab.color.heat
            : kollab.color.inkMuted;
        return {
          campaignId,
          name: campaign?.name || 'Campaign',
          niche: campaign?.requiredInfluencerNiche || campaign?.type || null,
          cover: nicheCoverSource(campaign?.requiredInfluencerNiche || campaign?.type),
          status: statusLabel,
          when: relativeWhen(a.appliedAt),
          dot,
        };
      });
  }, [applications, participations, campaigns, kollab.color.heat, kollab.color.inkMuted]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchCampaigns(), fetchParticipations(), fetchMyApplications()]);
    } catch {
      /* keep last list */
    } finally {
      setRefreshing(false);
    }
  };

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

  return (
    <ScrollScreen
      padH={0}
      contentInsetBottom
      scrollProps={{
        refreshControl: (
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        ),
        contentContainerStyle: { flexGrow: 1, paddingBottom: 150 },
      }}
    >
      <View style={styles.head}>
        <KollabScreenHeader
          title="My collabs"
          subtitle="Activity and approved work"
          showBack={false}
          size="tab"
        />
      </View>

      {error ? <Text style={[styles.error, { color: kollab.color.heat }]}>{error}</Text> : null}

      {isLoading && list.length === 0 && activityItems.length === 0 ? (
        <ActivityIndicator size="large" color={kollab.color.ink} style={{ marginTop: 40 }} />
      ) : list.length === 0 && activityItems.length === 0 ? (
        <View style={[styles.empty, { borderColor: kollab.color.outline }]}>
          <Text style={[styles.emptyTitle, { color: kollab.color.ink }]}>No collabs yet</Text>
          <Text style={[styles.emptySub, { color: kollab.color.ink }]}>
            Submitted applications and approved collabs land here. Apply from Fresh collabs on Home.
          </Text>
          <KollabButton
            label="Browse fresh collabs"
            variant="ink"
            onPress={() => router.push('/influencer/dashboard' as never)}
            style={styles.browseBtn}
          />
        </View>
      ) : (
        <View style={styles.feed}>
          {activityItems.length > 0 ? (
            <View style={styles.activityBlock}>
              <KollabSectionLabel label="collab activity" />
              {activityItems.map((item) => (
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

          {list.length > 0 && activityItems.length > 0 ? (
            <KollabSectionLabel label="approved" />
          ) : null}

          {list.map((campaign) => {
            const cid = String(campaign.id);
            const pay = resolveCampaignPaySummary(campaign);
            const brand = String(campaign.tenant?.tenantName || 'Brand');
            const st = statusFor(campaign);
            const chip = kollab.statusChip[st.tone];
            return (
              <PhotoCard
                key={cid}
                cover={nicheCoverSource(campaign.requiredInfluencerNiche)}
                title={String(campaign.name || 'Untitled')}
                meta={buildMeta(campaign)}
                payLabel={pay.primaryLabel}
                brand={{ logo: brandInitials(brand), logoBg: kollab.color.panel, brand }}
                status={{ label: st.label, bg: chip.bg, fg: chip.fg }}
                onPress={() => setSelectedCampaignId(cid)}
              />
            );
          })}

          {list.length > 0 ? (
            <Text style={[styles.endCaption, { color: kollab.color.ink }]}>That's all for now</Text>
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
  error: {
    fontFamily: font.body,
    fontSize: 13,
    paddingHorizontal: 22,
    marginBottom: 8,
  },
  empty: {
    marginHorizontal: 30,
    borderRadius: 26,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 38,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    ...kType.sectionTitle,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: font.body,
    fontSize: 13,
    opacity: 0.55,
    marginTop: 6,
    textAlign: 'center',
    marginBottom: 16,
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
