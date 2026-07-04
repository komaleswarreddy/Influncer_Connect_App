import React, { useCallback, useEffect } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PrimaryButton, SecondaryButton, SectionHeader, PremiumCard } from '@/components/ui';
import { appShell, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';
import { useCampaignStore } from '@/store/campaign-store';

function navigateForNotification(
  router: ReturnType<typeof useRouter>,
  n: { type: string; campaignId?: string | null; inviteId?: string | null; metadata?: unknown }
) {
  const meta = (n.metadata ?? {}) as { bookingId?: string };
  if (n.type === 'campaign_invite' && n.inviteId) {
    router.push('/influencer/invites' as never);
    return;
  }
  if (n.type === 'campaign_activated' || n.type === 'campaign_update') {
    router.push('/influencer/(tabs)/campaigns' as never);
    return;
  }
  if (n.type.startsWith('rate_card_booking')) {
    router.push({
      pathname: '/account-screens/bookings',
      params: meta.bookingId ? { bookingId: meta.bookingId } : undefined,
    } as never);
    return;
  }
  if (n.type.startsWith('ugc_')) {
    router.push('/influencer/(tabs)/campaigns' as never);
    return;
  }
  if (n.type === 'payment_received') {
    router.push('/account-screens/payments' as never);
  }
}

export function InboxContent({ showHeader = true }: { showHeader?: boolean }) {
  const router = useRouter();
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

  const refresh = useCallback(async () => {
    await Promise.all([fetchInvites(), fetchNotifications()]);
  }, [fetchInvites, fetchNotifications]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void refresh()} />}
    >
      {showHeader ? (
        <SectionHeader
          overline="Inbox"
          title="Collab inbox"
          subtitle={`${unreadNotifications} unread`}
        />
      ) : null}

      <PremiumCard compact title="Notifications">
        {notifications.length === 0 ? (
          <Text style={styles.muted}>No notifications yet.</Text>
        ) : (
          notifications.map((n) => (
            <View key={n.id} style={styles.notificationRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.muted}>{n.body}</Text>
                <PrimaryButton
                  label="Open"
                  compact
                  pill
                  onPress={async () => {
                    if (!n.isRead) await markNotificationRead(n.id);
                    navigateForNotification(router, n);
                  }}
                />
              </View>
              {!n.isRead ? (
                <SecondaryButton label="Mark read" onPress={() => void markNotificationRead(n.id)} />
              ) : null}
            </View>
          ))
        )}
      </PremiumCard>

      <PremiumCard compact title="Pending invites" style={{ marginTop: spacing.md }}>
        {invites.filter((i) => i.status === 'sent' || i.status === 'viewed').length === 0 ? (
          <Text style={styles.muted}>No pending invites.</Text>
        ) : (
          invites
            .filter((i) => i.status === 'sent' || i.status === 'viewed')
            .map((invite) => (
              <View key={invite.id} style={styles.inviteCard}>
                <View style={styles.inviteTopRow}>
                  <Text style={styles.title}>{invite.campaign?.name || 'Campaign invite'}</Text>
                </View>
                <Text style={styles.muted}>
                  Expires: {invite.expiresAt ? new Date(invite.expiresAt).toLocaleString() : 'N/A'}
                </Text>
                <View style={styles.actions}>
                  <SecondaryButton
                    label="Decline"
                    onPress={async () => {
                      try {
                        await declineInvite(invite.id);
                      } catch (e) {
                        Alert.alert('Invite', e instanceof Error ? e.message : 'Could not decline');
                      }
                    }}
                    disabled={isLoading}
                  />
                  <PrimaryButton
                    label="Accept"
                    onPress={async () => {
                      try {
                        await markInviteViewed(invite.id);
                        const participationId = await acceptInvite(invite.id);
                        if (participationId) {
                          router.push(`/influencer/contract?participationId=${participationId}`);
                        }
                      } catch (e) {
                        Alert.alert('Invite', e instanceof Error ? e.message : 'Could not accept');
                      }
                    }}
                    disabled={isLoading}
                  />
                </View>
              </View>
            ))
        )}
      </PremiumCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appShell.canvas },
  content: { padding: spacing.md, paddingBottom: spacing.lg },
  muted: { color: appShell.textSecondary, fontSize: 13, fontFamily: fonts.regular },
  title: { color: appShell.textPrimary, fontSize: 14, fontFamily: fonts.semiBold },
  notificationRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm, alignItems: 'flex-start' },
  inviteCard: { marginBottom: spacing.md, gap: spacing.xs },
  inviteTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
