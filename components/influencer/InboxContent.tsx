import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useKollab, font } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';
import { KollabButton } from '@/components/ui/KollabButton';
import { showKollabToast } from '@/components/ui/PremiumToast';
import { KollabSegmented } from '@/components/ui/KollabSegmented';
import { Glyph, type GlyphName } from '@/components/ui/Glyph';
import { useCampaignStore } from '@/store/campaign-store';
import { campaignCoverSource } from '@/lib/campaign-cover';
import { CoverImage } from '@/components/ui';
import { resolveCampaignPaySummary } from '@/lib/campaign-pay-summary';

type NotifNav = {
  type: string;
  title?: string;
  campaignId?: string | null;
  inviteId?: string | null;
  metadata?: unknown;
};

type NotifMeta = {
  bookingId?: string;
  participationId?: string;
  status?: string;
};

function readMeta(metadata: unknown): NotifMeta {
  if (!metadata || typeof metadata !== 'object') return {};
  const m = metadata as Record<string, unknown>;
  return {
    bookingId: typeof m.bookingId === 'string' ? m.bookingId : undefined,
    participationId: typeof m.participationId === 'string' ? m.participationId : undefined,
    status: typeof m.status === 'string' ? m.status : undefined,
  };
}

function isApprovedNotif(n: {
  type?: string | null;
  title?: string | null;
  metadata?: unknown;
}): boolean {
  const type = String(n.type || '').toLowerCase();
  const title = String(n.title || '').toLowerCase();
  const meta = readMeta(n.metadata);
  return meta.status === 'approved' || title.includes('approv') || type.includes('approv');
}

/** Short status phrase for every notification. */
export function notificationStatusTitle(n: {
  type?: string | null;
  title?: string | null;
}): string {
  const type = String(n.type || '').toLowerCase();
  const title = String(n.title || '').toLowerCase();

  if (type === 'campaign_invite') return 'New invite';
  if (title.includes('approv') || type.includes('approv')) return 'Invite approved';
  if (type === 'invite_accepted' || title.includes('accept') || type.includes('accept')) {
    return 'Invite accepted';
  }
  if (
    type === 'invite_declined' ||
    title.includes('reject') ||
    title.includes('declin') ||
    type.includes('reject')
  ) {
    return 'Invite rejected';
  }
  if (type === 'invite_expired') return 'Invite expired';
  if (type === 'campaign_activated') return 'Campaign active';
  if (type === 'payment_received' || title.includes('payment') || title.includes('paid')) {
    return 'Payment received';
  }
  if (type === 'rate_card_booking_request' || title.includes('booking request')) {
    return 'Booking request';
  }
  if (type === 'rate_card_deliverable_submitted') return 'Deliverable submitted';
  if (type.startsWith('rate_card_booking') || title.includes('booking')) {
    return 'Booking update';
  }
  if (type.startsWith('ugc_')) return 'UGC update';
  if (type === 'campaign_update' || title.includes('update')) return 'Campaign update';
  return 'Campaign update';
}

function formatRelativeTime(input: string): string {
  const ts = new Date(input).getTime();
  if (!Number.isFinite(ts)) return '';
  const diffMs = Date.now() - ts;
  if (diffMs < 60 * 1000) return 'now';
  const mins = Math.floor(diffMs / (60 * 1000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type NotificationIcon = {
  name: GlyphName;
  bg: string;
  color: string;
};

function notificationIconForStatus(statusTitle: string, kollab: KollabTokens): NotificationIcon {
  switch (statusTitle) {
    case 'New invite':
      return { name: 'layers', bg: kollab.color.tint, color: kollab.color.violet };
    case 'Invite approved':
    case 'Invite accepted':
    case 'Campaign active':
      return { name: 'check', bg: kollab.color.tealTint, color: kollab.color.teal };
    case 'Invite rejected':
    case 'Invite expired':
      return { name: 'help', bg: kollab.statusChip.warn.bg, color: kollab.statusChip.warn.fg };
    case 'Payment received':
      return { name: 'wallet', bg: kollab.color.chartreuse, color: kollab.color.onChartreuse };
    case 'Booking request':
    case 'Deliverable submitted':
    case 'Booking update':
      return { name: 'cal', bg: kollab.color.tint, color: kollab.color.violet };
    case 'UGC update':
      return { name: 'video', bg: kollab.color.tealTint, color: kollab.color.teal };
    case 'Campaign update':
    default:
      return { name: 'layers', bg: kollab.color.tint, color: kollab.color.violet };
  }
}

function pushCampaigns(router: ReturnType<typeof useRouter>, campaignId?: string | null) {
  if (campaignId) {
    router.push({
      pathname: '/influencer/campaigns',
      params: { campaignId: String(campaignId) },
    } as never);
    return;
  }
  router.push('/influencer/campaigns' as never);
}

/**
 * Inbox keeps history after read (like Mail / Messages).
 * Unread badge drops; items stay visible but muted.
 */
function navigateForNotification(
  router: ReturnType<typeof useRouter>,
  n: NotifNav,
  opts: { focusInvite: (inviteId: string | null) => void; scrollToPendingInvites: () => void }
) {
  const meta = readMeta(n.metadata);
  const type = String(n.type || '');

  if (type === 'campaign_invite') {
    opts.focusInvite(n.inviteId ? String(n.inviteId) : null);
    opts.scrollToPendingInvites();
    return;
  }

  if (isApprovedNotif(n) && meta.participationId) {
    router.push(
      `/influencer/contract?participationId=${encodeURIComponent(meta.participationId)}` as never
    );
    return;
  }

  if (type === 'campaign_activated' || type === 'campaign_update') {
    pushCampaigns(router, n.campaignId);
    return;
  }

  if (type === 'invite_accepted' || type === 'invite_declined' || type === 'invite_expired') {
    pushCampaigns(router, n.campaignId);
    return;
  }

  if (type === 'rate_card_deliverable_submitted' || type.startsWith('rate_card_booking')) {
    router.push({
      pathname: '/account-screens/bookings',
      params: meta.bookingId ? { bookingId: meta.bookingId } : undefined,
    } as never);
    return;
  }

  if (type.startsWith('ugc_')) {
    pushCampaigns(router, n.campaignId);
    return;
  }

  if (type === 'payment_received') {
    router.push('/account-screens/payments' as never);
    return;
  }

  pushCampaigns(router, n.campaignId);
}

type NotificationItem = ReturnType<typeof useCampaignStore.getState>['notifications'][number];
type InviteItem = ReturnType<typeof useCampaignStore.getState>['invites'][number];

/**
 * Notifications and pending invites are both short, server-paginated lists
 * (not the kind of unbounded history bookings/catalog screens accumulate),
 * and they share one ScrollView specifically so "New invite" notifications
 * can scroll the pending-invites card into view. Splitting them into two
 * FlatLists would break that cross-list scroll-to behavior for a
 * negligible virtualization win, so instead each row is memoized to avoid
 * re-rendering the whole list on unrelated state changes.
 */
const NotificationRow = React.memo(function NotificationRow({
  notification,
  onOpen,
  last,
}: {
  notification: NotificationItem;
  onOpen: (n: NotificationItem) => void;
  last?: boolean;
}) {
  const kollab = useKollab();
  const styles = useKollabStyles(kollab);
  const isUnread = !notification.isRead;
  const statusTitle = notificationStatusTitle(notification);
  const relativeTime = formatRelativeTime(notification.createdAt);
  const icon = notificationIconForStatus(statusTitle, kollab);

  return (
    <View style={[styles.notificationRow, last ? styles.notificationRowLast : null]}>
      <View style={[styles.notificationIconWrap, { backgroundColor: icon.bg }]}>
        <Glyph name={icon.name} size={17} color={icon.color} />
      </View>
      <View style={styles.notificationBody}>
        <View style={styles.notificationTitleRow}>
          <Text
            style={[
              styles.title,
              { color: isUnread ? kollab.color.ink : kollab.color.inkMuted },
              !isUnread ? { fontFamily: font.body } : null,
            ]}
            numberOfLines={1}
          >
            {statusTitle}
          </Text>
          {isUnread ? <View style={styles.unreadDot} /> : null}
        </View>
        {notification.body ? (
          <Text style={styles.messageText} numberOfLines={2}>
            {notification.body}
          </Text>
        ) : null}
        <Text style={styles.timeText}>{relativeTime}</Text>
      </View>
      <KollabButton
        label="Open"
        variant="soft"
        compact
        onPress={() => onOpen(notification)}
        style={styles.openButton}
      />
    </View>
  );
});

const InviteRow = React.memo(function InviteRow({
  invite,
  highlighted,
  disabled,
  onDecline,
  onAccept,
}: {
  invite: InviteItem;
  highlighted: boolean;
  disabled: boolean;
  onDecline: (invite: InviteItem) => void;
  onAccept: (invite: InviteItem) => void;
}) {
  const kollab = useKollab();
  const styles = useKollabStyles(kollab);
  const campaign = invite.campaign;
  const isNew = invite.status === 'sent';
  const brandName = campaign?.tenant?.tenantName;
  const paySummary = campaign
    ? resolveCampaignPaySummary({
        paySummary: campaign.paySummary,
        paymentModel: campaign.paymentModel,
        commissionRate: campaign.commissionRate,
      })
    : null;
  const payLine = paySummary ? `${paySummary.primaryLabel} ${paySummary.secondaryLabel}` : null;
  const metaLine = [brandName, payLine].filter(Boolean).join(' · ');

  return (
    <View
      style={[
        styles.inviteCard,
        highlighted
          ? {
              backgroundColor: kollab.color.tint,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: kollab.color.hairline,
            }
          : null,
      ]}
    >
      <View style={styles.inviteTopRow}>
        <View style={styles.inviteCover}>
          <CoverImage source={campaignCoverSource(campaign)} />
        </View>
        <View style={styles.inviteInfo}>
          {isNew ? (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>New invite</Text>
            </View>
          ) : null}
          <Text style={styles.inviteTitle} numberOfLines={2}>
            {campaign?.name || 'Campaign invite'}
          </Text>
          {metaLine ? (
            <Text style={styles.muted} numberOfLines={1}>
              {metaLine}
            </Text>
          ) : null}
        </View>
      </View>
      <Text style={[styles.muted, styles.expiresLine]}>
        Expires: {invite.expiresAt ? new Date(invite.expiresAt).toLocaleString() : 'N/A'}
      </Text>
      <View style={styles.actions}>
        <KollabButton
          label="Decline"
          variant="hairline"
          compact
          onPress={() => onDecline(invite)}
          disabled={disabled}
          style={styles.flexButton}
        />
        <KollabButton
          label="Accept"
          variant="ink"
          compact
          onPress={() => onAccept(invite)}
          disabled={disabled}
          style={styles.flexButton}
        />
      </View>
    </View>
  );
});

export function InboxContent({ showHeader = true }: { showHeader?: boolean }) {
  const kollab = useKollab();
  const styles = useKollabStyles(kollab);
  const router = useRouter();
  const params = useLocalSearchParams<{ inviteId?: string }>();
  const {
    invites,
    notifications,
    unreadNotifications,
    isLoading,
    fetchInvites,
    fetchNotifications,
    acceptInvite,
    declineInvite,
    markNotificationRead,
    markInviteViewed,
  } = useCampaignStore();

  const scrollRef = useRef<ScrollView>(null);
  const pendingY = useRef(0);
  const [focusedInviteId, setFocusedInviteId] = useState<string | null>(
    params.inviteId ? String(params.inviteId) : null
  );
  const [activeTab, setActiveTab] = useState<'invites' | 'notifications'>('invites');

  const refresh = useCallback(async () => {
    await Promise.all([fetchInvites(), fetchNotifications()]);
  }, [fetchInvites, fetchNotifications]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (params.inviteId) {
      setFocusedInviteId(String(params.inviteId));
    }
  }, [params.inviteId]);

  const scrollToPendingInvites = useCallback(() => {
    setActiveTab('invites');
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, pendingY.current - 12), animated: true });
    });
  }, []);

  const onPendingLayout = useCallback((e: LayoutChangeEvent) => {
    pendingY.current = e.nativeEvent.layout.y;
  }, []);

  const pendingInvites = useMemo(
    () => invites.filter((i) => i.status === 'sent' || i.status === 'viewed'),
    [invites]
  );

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notifications]);

  const onOpenNotification = useCallback(
    async (n: NotifNav & { id: string; isRead: boolean }) => {
      try {
        if (!n.isRead) await markNotificationRead(n.id);
        navigateForNotification(router, n, {
          focusInvite: setFocusedInviteId,
          scrollToPendingInvites,
        });
      } catch (e) {
        showKollabToast(e instanceof Error ? e.message : 'Could not open notification');
      }
    },
    [markNotificationRead, router, scrollToPendingInvites]
  );

  const onDeclineInvite = useCallback(
    async (invite: { id: string }) => {
      try {
        await declineInvite(invite.id);
        if (focusedInviteId === invite.id) setFocusedInviteId(null);
        showKollabToast('Invite declined');
      } catch (e) {
        showKollabToast(e instanceof Error ? e.message : 'Could not decline');
      }
    },
    [declineInvite, focusedInviteId]
  );

  const onAcceptInvite = useCallback(
    async (invite: { id: string }) => {
      try {
        await markInviteViewed(invite.id);
        const participationId = await acceptInvite(invite.id);
        if (participationId) {
          showKollabToast('Booking accepted');
          router.push(`/influencer/contract?participationId=${participationId}`);
        }
      } catch (e) {
        showKollabToast(e instanceof Error ? e.message : 'Could not accept');
      }
    },
    [markInviteViewed, acceptInvite, router]
  );

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.screen, { backgroundColor: kollab.color.screen }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => void refresh()}
          tintColor={kollab.color.ink}
        />
      }
    >
      {showHeader ? (
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Inbox</Text>
          <Text style={styles.pageSubtitle}>Invites and collab notifications</Text>
        </View>
      ) : null}

      <KollabSegmented
        style={styles.tabTrack}
        segments={[
          { key: 'invites', label: 'Invites' },
          {
            key: 'notifications',
            label:
              unreadNotifications > 0 ? `Notifications (${unreadNotifications})` : 'Notifications',
          },
        ]}
        value={activeTab}
        onChange={(key) => setActiveTab(key as 'invites' | 'notifications')}
      />

      {activeTab === 'invites' ? (
        <View style={styles.inviteList} onLayout={onPendingLayout}>
          {pendingInvites.length === 0 ? (
            <Text style={[styles.muted, { paddingHorizontal: 4 }]}>No pending invites.</Text>
          ) : (
            pendingInvites.map((invite) => (
              <InviteRow
                key={invite.id}
                invite={invite}
                highlighted={focusedInviteId != null && focusedInviteId === invite.id}
                disabled={isLoading}
                onDecline={onDeclineInvite}
                onAccept={onAcceptInvite}
              />
            ))
          )}
        </View>
      ) : (
        <View style={styles.notifCard}>
          {sortedNotifications.length === 0 ? (
            <Text style={[styles.muted, { paddingVertical: 16 }]}>No notifications yet.</Text>
          ) : (
            sortedNotifications.map((n, idx) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onOpen={onOpenNotification}
                last={idx === sortedNotifications.length - 1}
              />
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

function useKollabStyles(kollab: KollabTokens) {
  return React.useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1 },
        content: { paddingBottom: 40 },
        headerBlock: { marginBottom: 8, paddingHorizontal: 22 },
        pageTitle: {
          fontFamily: font.display,
          fontSize: 28,
          lineHeight: 30,
          letterSpacing: -0.5,
          color: kollab.color.ink,
        },
        pageSubtitle: {
          fontFamily: font.body,
          fontSize: 13,
          marginTop: 4,
          color: kollab.color.ink,
          opacity: 0.55,
        },
        tabTrack: {
          marginHorizontal: 22,
          marginBottom: 16,
        },
        inviteList: {
          paddingHorizontal: 18,
          gap: 10,
        },
        notifCard: {
          backgroundColor: kollab.color.card,
          borderRadius: 24,
          marginHorizontal: 18,
          paddingHorizontal: 18,
          paddingVertical: 4,
          ...kollab.shadow.card,
        },
        muted: { fontSize: 13, fontFamily: font.body, color: kollab.color.inkMuted },
        title: {
          flex: 1,
          minWidth: 0,
          fontSize: 13.5,
          fontFamily: font.semiBold,
        },
        titleRead: { fontFamily: font.body },
        inviteTitle: {
          fontSize: 14.5,
          fontFamily: font.semiBold,
          color: kollab.color.ink,
          marginTop: 5,
        },
        inviteTopRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
        inviteCover: {
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: kollab.color.imgBg,
          flexShrink: 0,
          overflow: 'hidden',
        },
        inviteInfo: { flex: 1, minWidth: 0 },
        newBadge: {
          alignSelf: 'flex-start',
          backgroundColor: kollab.color.chartreuse,
          borderRadius: 99,
          paddingHorizontal: 9,
          paddingVertical: 3,
        },
        newBadgeText: {
          fontFamily: font.bold,
          fontSize: 10.5,
          color: kollab.color.onChartreuse,
        },
        expiresLine: { marginTop: 8 },
        notificationIconWrap: {
          width: 36,
          height: 36,
          borderRadius: 99,
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
        },
        notificationBody: {
          flex: 1,
          minWidth: 0,
        },
        notificationTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 7,
        },
        unreadDot: {
          width: 7,
          height: 7,
          borderRadius: 99,
          backgroundColor: kollab.color.violet,
        },
        messageText: {
          fontSize: 12.5,
          fontFamily: font.body,
          color: kollab.color.ink,
          opacity: 0.6,
          lineHeight: 18,
          marginTop: 3,
        },
        openButton: { flexShrink: 0 },
        timeText: {
          fontSize: 11,
          fontFamily: font.body,
          color: kollab.color.ink,
          opacity: 0.4,
          marginTop: 4,
        },
        notificationRow: {
          paddingVertical: 15,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 13,
          borderBottomWidth: 1,
          borderBottomColor: kollab.color.hairline,
        },
        notificationRowLast: {
          borderBottomWidth: 0,
        },
        inviteCard: {
          backgroundColor: kollab.color.card,
          borderRadius: 22,
          padding: 15,
          ...kollab.shadow.card,
        },
        actions: {
          flexDirection: 'row',
          gap: 9,
          marginTop: 13,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: kollab.color.hairline,
        },
        flexButton: { flex: 1 },
      }),
    [kollab]
  );
}
