import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { SvgXml } from 'react-native-svg';
import {
  KollabButton,
  KollabEmptyCard,
  KollabScreenHeader,
  KollabSectionLabel,
  KollabStatTile,
  KollabStatusChip,
  ScrollScreen,
  showKollabConfirm,
  showKollabToast,
} from '@/components/ui';
import { eventsApi, type EventDetail } from '@/lib/events-api';
import { EVENT_STATUS_UI, formatEventRange } from '@/lib/events-ui';
import { eventShareText } from '@/lib/share-text';
import { formatInr } from '@/lib/currency';
import { font, useKollab } from '@/theme/kollab-tokens';

export default function EventDetailScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = typeof id === 'string' ? id : '';

  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) {
      setError('Event not found');
      setLoading(false);
      return;
    }
    try {
      setDetail(await eventsApi.get(eventId));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this event');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const status = detail?.event.status;
  const slug = detail?.event.slug;
  useEffect(() => {
    if (!eventId || status !== 'published') {
      setQrSvg(null);
      return;
    }
    let live = true;
    eventsApi
      .qr(eventId)
      .then((r) => live && setQrSvg(r.svg))
      .catch(() => live && setQrSvg(null));
    return () => {
      live = false;
    };
  }, [eventId, status, slug]);

  const run = async (key: string, task: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    try {
      await task();
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  const publish = () =>
    run('publish', async () => {
      await eventsApi.publish(eventId);
      showKollabToast('Your event is live');
      await load();
    });

  const unpublish = async () => {
    const ok = await showKollabConfirm({
      title: 'Take this event offline?',
      message: 'It goes back to draft and its link stops working until you publish again.',
      confirmLabel: 'Unpublish',
    });
    if (!ok) return;
    await run('unpublish', async () => {
      await eventsApi.unpublish(eventId);
      await load();
    });
  };

  const cancel = async () => {
    const sold = detail?.stats.paidOrders ?? 0;
    const ok = await showKollabConfirm({
      title: 'Cancel this event?',
      message:
        sold > 0
          ? `All tickets stop working and buyers are told the event is cancelled. ${sold} paid order${sold === 1 ? '' : 's'} will need a refund from your payment dashboard. This can’t be undone.`
          : 'All tickets stop working and the page shows the event as cancelled. This can’t be undone.',
      confirmLabel: 'Cancel event',
      cancelLabel: 'Keep it',
      destructive: true,
    });
    if (!ok) return;
    await run('cancel', async () => {
      const res = await eventsApi.cancel(eventId);
      showKollabToast(
        res.refundsDue.orders > 0
          ? `Cancelled. ${res.refundsDue.orders} order(s) to refund.`
          : 'Event cancelled'
      );
      await load();
    });
  };

  const remove = async () => {
    const ok = await showKollabConfirm({
      title: 'Delete this draft?',
      message: 'It will be removed permanently.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await run('delete', async () => {
      await eventsApi.remove(eventId);
      router.replace('/account-screens/events' as never);
    });
  };

  const copyLink = async () => {
    if (!detail) return;
    try {
      await Clipboard.setStringAsync(detail.event.url);
      showKollabToast('Link copied');
    } catch {
      showKollabToast('Could not copy the link');
    }
  };

  const shareLink = async () => {
    if (!detail) return;
    try {
      const ev = detail.event;
      await Share.share({
        message: eventShareText({
          title: ev.title,
          when: formatEventRange(ev.startsAt, ev.endsAt),
          where: ev.isOnline ? 'Online' : ev.venueName || ev.address || '',
          url: ev.url,
        }),
      });
    } catch {
      showKollabToast('Could not open the share sheet');
    }
  };

  const openLink = async () => {
    if (!detail) return;
    try {
      await Linking.openURL(detail.event.url);
    } catch {
      showKollabToast('Could not open the link');
    }
  };

  const ev = detail?.event;
  const ui = ev ? EVENT_STATUS_UI[ev.displayStatus] : null;

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        ),
      }}
    >
      <KollabScreenHeader title="Event" subtitle={ev?.title} />

      {loading ? (
        <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />
      ) : error || !detail || !ev || !ui ? (
        <KollabEmptyCard
          title="Couldn’t open this event"
          subtitle={error ?? 'It may have been deleted.'}
          ctaLabel="Back to events"
          onPress={() => router.replace('/account-screens/events' as never)}
          style={{ marginHorizontal: 0 }}
        />
      ) : (
        <View style={styles.stack}>
          {ev.bannerUrl ? (
            <Image source={{ uri: ev.bannerUrl }} style={styles.banner} contentFit="cover" />
          ) : null}

          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.title, { color: c.ink }]}>{ev.title}</Text>
              <KollabStatusChip tone={ui.tone} label={ui.label} />
            </View>
            <Text style={[styles.muted, { color: c.ink }]}>
              {formatEventRange(ev.startsAt, ev.endsAt)}
            </Text>
            <Text style={[styles.muted, { color: c.ink }]}>
              {ev.isOnline
                ? 'Online event'
                : [ev.venueName, ev.address].filter(Boolean).join(', ') || 'Venue not set'}
            </Text>
          </View>

          {ev.status === 'cancelled' && detail.stats.refundsDue.orders > 0 ? (
            <View style={[styles.banner2, { backgroundColor: c.heatTint }]}>
              <Text style={[styles.bannerText, { color: c.heat }]}>
                {detail.stats.refundsDue.orders} order
                {detail.stats.refundsDue.orders === 1 ? '' : 's'} (
                {formatInr(detail.stats.refundsDue.amount)}) need a refund. Refund them from your
                payment dashboard.
              </Text>
            </View>
          ) : null}

          <View style={styles.tiles}>
            <KollabStatTile
              label="Tickets sold"
              value={`${detail.stats.ticketsSold}`}
              delta={`of ${ev.capacity} · ${detail.availability.remaining} left`}
              fill="dark"
              style={styles.tile}
            />
            <KollabStatTile
              label="Checked in"
              value={`${detail.stats.checkedIn}`}
              delta={`of ${detail.stats.ticketsIssued} tickets`}
              fill="tint"
              style={styles.tile}
            />
          </View>
          <View style={styles.tiles}>
            <KollabStatTile
              label="Revenue"
              value={formatInr(detail.stats.revenue)}
              delta={
                detail.stats.platformFees > 0
                  ? `${formatInr(detail.stats.netRevenue)} after fees`
                  : `${detail.stats.paidOrders} paid order${detail.stats.paidOrders === 1 ? '' : 's'}`
              }
              fill="card"
              style={styles.tile}
            />
            <KollabStatTile
              label="Free orders"
              value={`${detail.stats.freeOrders}`}
              delta={
                detail.stats.pendingOrders > 0
                  ? `${detail.stats.pendingOrders} awaiting payment`
                  : 'RSVPs'
              }
              fill="card"
              style={styles.tile}
            />
          </View>

          {ev.status === 'published' ? (
            <>
              <KollabSectionLabel label="share" />
              <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
                <Text style={[styles.link, { color: c.violetDeep }]} selectable numberOfLines={2}>
                  {ev.url}
                </Text>
                <View style={styles.row}>
                  <KollabButton
                    label="Copy"
                    variant="soft"
                    compact
                    onPress={() => void copyLink()}
                    style={styles.flex}
                  />
                  <KollabButton
                    label="Share"
                    variant="soft"
                    compact
                    onPress={() => void shareLink()}
                    style={styles.flex}
                  />
                  <KollabButton
                    label="Open"
                    variant="hairline"
                    compact
                    onPress={() => void openLink()}
                    style={styles.flex}
                  />
                </View>
                {qrSvg ? (
                  <View style={styles.qrWrap}>
                    <View style={styles.qrBox}>
                      <SvgXml xml={qrSvg} width={168} height={168} />
                    </View>
                    <Text style={[styles.muted, { color: c.ink, textAlign: 'center' }]}>
                      Scan to open the event page
                    </Text>
                  </View>
                ) : null}
              </View>
            </>
          ) : null}

          <KollabSectionLabel label="manage" />
          <View style={styles.actions}>
            {ev.status === 'published' ? (
              <KollabButton
                label="Scan tickets"
                variant="primary"
                onPress={() => router.push(`/account-screens/event-scanner?id=${ev.id}` as never)}
              />
            ) : null}
            <KollabButton
              label={`Attendees (${detail.stats.ticketsIssued})`}
              variant="soft"
              onPress={() => router.push(`/account-screens/event-attendees?id=${ev.id}` as never)}
            />
            {ev.status !== 'cancelled' ? (
              <KollabButton
                label="Passes"
                variant="soft"
                onPress={() => router.push(`/account-screens/event-passes?id=${ev.id}` as never)}
              />
            ) : null}
            {ev.status !== 'cancelled' ? (
              <KollabButton
                label="Edit details"
                variant="soft"
                onPress={() => router.push(`/account-screens/event-form?id=${ev.id}` as never)}
              />
            ) : null}
            {ev.status === 'draft' ? (
              <KollabButton
                label="Publish event"
                variant="ink"
                loading={busy === 'publish'}
                onPress={() => void publish()}
              />
            ) : null}
            {ev.status === 'published' ? (
              <KollabButton
                label="Unpublish"
                variant="hairline"
                loading={busy === 'unpublish'}
                onPress={() => void unpublish()}
              />
            ) : null}
            {ev.status === 'published' ? (
              <KollabButton
                label="Cancel event"
                variant="hairline"
                loading={busy === 'cancel'}
                onPress={() => void cancel()}
              />
            ) : null}
            {ev.status === 'draft' ? (
              <KollabButton
                label="Delete draft"
                variant="hairline"
                loading={busy === 'delete'}
                onPress={() => void remove()}
              />
            ) : null}
          </View>
          {!detail.paymentsEnabled && detail.passes.some((p) => p.price > 0) ? (
            <Text style={[styles.muted, { color: c.heat }]}>
              Paid passes can not be sold until online payments are enabled on the server.
            </Text>
          ) : null}
        </View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  banner: { width: '100%', aspectRatio: 16 / 9, borderRadius: 20 },
  card: { borderRadius: 22, padding: 16, gap: 8 },
  banner2: { borderRadius: 16, padding: 14 },
  bannerText: { fontFamily: font.semiBold, fontSize: 13, lineHeight: 18 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: { flex: 1, fontFamily: font.bold, fontSize: 19 },
  muted: { fontFamily: font.body, fontSize: 13, opacity: 0.6, lineHeight: 18 },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1 },
  link: { fontFamily: font.medium, fontSize: 13.5 },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  qrWrap: { alignItems: 'center', gap: 8, marginTop: 6 },
  qrBox: { backgroundColor: '#ffffff', padding: 8, borderRadius: 12 },
  actions: { gap: 10 },
});
