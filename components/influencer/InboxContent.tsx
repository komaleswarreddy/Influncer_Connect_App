import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, SecondaryButton, SectionHeader, PremiumCard } from '@/components/ui';
import { spacing, useAppShell } from '@/theme';
import { fonts } from '@/components/ui/typography';
import { useCampaignStore } from '@/store/campaign-store';

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
  name: React.ComponentProps<typeof Ionicons>['name'];
  bg: string;
  color: string;
};

/** Icon + tint matched to the displayed status title. */
function notificationIconForStatus(statusTitle: string): NotificationIcon {
  switch (statusTitle) {
    case 'New invite':
      return { name: 'mail-unread', bg: 'rgba(59, 130, 246, 0.18)', color: '#3B82F6' };
    case 'Invite approved':
      return { name: 'shield-checkmark', bg: 'rgba(99, 102, 241, 0.18)', color: '#6366F1' };
    case 'Invite accepted':
      return { name: 'checkmark-circle', bg: 'rgba(16, 185, 129, 0.18)', color: '#10B981' };
    case 'Invite rejected':
      return { name: 'close-circle', bg: 'rgba(239, 68, 68, 0.18)', color: '#EF4444' };
    case 'Invite expired':
      return { name: 'time', bg: 'rgba(148, 163, 184, 0.22)', color: '#94A3B8' };
    case 'Campaign active':
      return { name: 'flash', bg: 'rgba(245, 158, 11, 0.18)', color: '#F59E0B' };
    case 'Payment received':
      return { name: 'wallet', bg: 'rgba(245, 158, 11, 0.18)', color: '#F59E0B' };
    case 'Booking request':
      return { name: 'calendar', bg: 'rgba(14, 165, 233, 0.18)', color: '#0EA5E9' };
    case 'Deliverable submitted':
      return { name: 'document-text', bg: 'rgba(139, 92, 246, 0.18)', color: '#8B5CF6' };
    case 'Booking update':
      return { name: 'calendar-outline', bg: 'rgba(14, 165, 233, 0.18)', color: '#0EA5E9' };
    case 'UGC update':
      return { name: 'videocam', bg: 'rgba(236, 72, 153, 0.18)', color: '#EC4899' };
    case 'Campaign update':
    default:
      return { name: 'megaphone-outline', bg: 'rgba(99, 102, 241, 0.18)', color: '#6366F1' };
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
}: {
  notification: NotificationItem;
  onOpen: (n: NotificationItem) => void;
}) {
  const shell = useAppShell();
  const isUnread = !notification.isRead;
  const statusTitle = notificationStatusTitle(notification);
  const relativeTime = formatRelativeTime(notification.createdAt);
  const icon = notificationIconForStatus(statusTitle);

  return (
    <View
      style={[
        styles.notificationRow,
        { backgroundColor: shell.card, borderColor: shell.cardBorder },
        !isUnread && styles.notificationRowRead,
      ]}
    >
      <View style={styles.notificationLeft}>
        <View style={[styles.notificationIconWrap, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={18} color={icon.color} />
        </View>
        <Text
          style={[
            styles.title,
            { color: isUnread ? shell.textPrimary : shell.textSecondary },
            !isUnread && styles.titleRead,
          ]}
          numberOfLines={1}
        >
          {statusTitle}
        </Text>
      </View>
      <View style={styles.notificationRight}>
        <Text style={[styles.timeText, { color: shell.textMuted }]}>{relativeTime}</Text>
        <PrimaryButton label="Open" compact pill onPress={() => onOpen(notification)} />
      </View>
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
  const shell = useAppShell();
  return (
    <View
      style={[
        styles.inviteCard,
        highlighted
          ? {
              backgroundColor: shell.iceBlue,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: shell.cardBorder,
            }
          : null,
      ]}
    >
      <View style={styles.inviteTopRow}>
        <Text style={[styles.inviteTitle, { color: shell.textPrimary }]}>
          {invite.campaign?.name || 'Campaign invite'}
        </Text>
      </View>
      <Text style={[styles.muted, { color: shell.textSecondary }]}>
        Expires: {invite.expiresAt ? new Date(invite.expiresAt).toLocaleString() : 'N/A'}
      </Text>
      <View style={styles.actions}>
        <SecondaryButton label="Decline" onPress={() => onDecline(invite)} disabled={disabled} />
        <PrimaryButton label="Accept" onPress={() => onAccept(invite)} disabled={disabled} />
      </View>
    </View>
  );
});

export function InboxContent({ showHeader = true }: { showHeader?: boolean }) {
  const shell = useAppShell();
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
        Alert.alert('Notification', e instanceof Error ? e.message : 'Could not open notification');
      }
    },
    [markNotificationRead, router, scrollToPendingInvites]
  );

  const onDeclineInvite = useCallback(
    async (invite: { id: string }) => {
      try {
        await declineInvite(invite.id);
        if (focusedInviteId === invite.id) setFocusedInviteId(null);
      } catch (e) {
        Alert.alert('Invite', e instanceof Error ? e.message : 'Could not decline');
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
          router.push(`/influencer/contract?participationId=${participationId}`);
        }
      } catch (e) {
        Alert.alert('Invite', e instanceof Error ? e.message : 'Could not accept');
      }
    },
    [markInviteViewed, acceptInvite, router]
  );

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.screen, { backgroundColor: shell.canvas }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={() => void refresh()}
          tintColor={shell.cta}
        />
      }
    >
      {showHeader ? (
        <SectionHeader
          overline="Inbox"
          title="Collab inbox"
          subtitle={`${unreadNotifications} unread`}
        />
      ) : null}

      <PremiumCard compact title="Notifications">
        {sortedNotifications.length === 0 ? (
          <Text style={[styles.muted, { color: shell.textSecondary }]}>No notifications yet.</Text>
        ) : (
          sortedNotifications.map((n) => (
            <NotificationRow key={n.id} notification={n} onOpen={onOpenNotification} />
          ))
        )}
      </PremiumCard>

      <PremiumCard
        compact
        title="Pending invites"
        style={{ marginTop: spacing.md }}
        onLayout={onPendingLayout}
      >
        {pendingInvites.length === 0 ? (
          <Text style={[styles.muted, { color: shell.textSecondary }]}>No pending invites.</Text>
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
      </PremiumCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.lg },
  muted: { fontSize: 13, fontFamily: fonts.regular },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  titleRead: { fontFamily: fonts.regular },
  inviteTitle: { fontSize: 14, fontFamily: fonts.semiBold, flex: 1 },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  notificationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notificationRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingLeft: spacing.xs,
  },
  timeText: {
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  notificationRow: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  notificationRowRead: {
    opacity: 1,
  },
  inviteCard: {
    marginBottom: spacing.md,
    gap: spacing.xs,
    borderRadius: 12,
    padding: spacing.sm,
    backgroundColor: 'transparent',
  },
  inviteTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
