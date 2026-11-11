import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  type ListRenderItemInfo,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { rateCardsApi } from '@/lib/rate-cards-api';
import {
  bookingStatusShort,
  bookingStatusTone,
  labelForContentType,
  type OpportunityStatusTone,
} from '@/lib/opportunity-card-ui';
import { formatInr } from '@/lib/currency';
import { formatDateTime } from '@/lib/content-url';
import { KollabButton, KollabScreenHeader, showKollabToast } from '@/components/ui';
import { ReasonSheet, type ReasonOption } from '@/components/influencer/ReasonSheet';
import { useKollab, font, space, type as kType } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Deliverable = { status?: string; brandFeedback?: string | null };

/** Same lists as the API (server/services/booking-cancel-rules.ts). */
const DECLINE_REASONS: ReasonOption[] = [
  { key: 'not_available', label: 'Not available' },
  { key: 'rate_too_low', label: 'Rate is too low' },
  { key: 'not_a_fit', label: 'Not a fit for me' },
  { key: 'other', label: 'Other' },
];
const CANCEL_REASONS: ReasonOption[] = [
  { key: 'schedule_conflict', label: 'Schedule conflict' },
  { key: 'not_available', label: 'No longer available' },
  { key: 'brief_changed', label: 'The brief changed' },
  { key: 'other', label: 'Other' },
];

type SheetState = { kind: 'decline' | 'cancel'; id: string; inProgress?: boolean } | null;

function canDeliver(status: string, deliverable?: Deliverable | null): boolean {
  if (status === 'accepted') return true;
  return status === 'in_progress' && deliverable?.status === 'revision_requested';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? 'B';
  const b = parts[1]?.[0] ?? parts[0]?.[1] ?? '';
  return (a + b).toUpperCase();
}

function statusColors(tone: OpportunityStatusTone, kollab: KollabTokens) {
  if (tone === 'pending' || tone === 'active' || tone === 'success') {
    return { bg: kollab.color.chartreuse, fg: kollab.color.onChartreuse };
  }
  if (tone === 'review') return { bg: kollab.color.tealTint, fg: kollab.color.teal };
  if (tone === 'warning' || tone === 'declined')
    return { bg: kollab.color.heatTint, fg: kollab.color.heat };
  return { bg: kollab.color.tint, fg: kollab.color.violetDeep };
}

type Row = {
  booking: Record<string, unknown>;
  brand?: { name?: string };
  deliverable?: Deliverable | null;
};

export function BookingsList({
  showHeader = true,
  highlightBookingId,
}: {
  showHeader?: boolean;
  highlightBookingId?: string;
}) {
  const router = useRouter();
  const kollab = useKollab();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetState>(null);
  // Blocks a second tap on Accept / Decline while the first one is still being sent.
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = (await rateCardsApi.getBookings()) as { bookings?: Row[] };
      setRows(res.bookings ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load bookings';
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const respond = useCallback(
    async (id: string, status: 'accepted' | 'declined', extra?: { reason?: string; note?: string }) => {
      if (busyId) return;
      setBusyId(id);
      try {
        await rateCardsApi.respondBooking(id, status, extra);
        setError(null);
        await load(true);
        showKollabToast(status === 'accepted' ? 'Booking accepted' : 'Booking declined');
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed';
        setError(message);
        throw e;
      } finally {
        setBusyId(null);
      }
    },
    [load, busyId]
  );

  const acceptBooking = useCallback(
    (id: string) => {
      void respond(id, 'accepted').catch(() => undefined);
    },
    [respond]
  );

  const openDeliver = useCallback(
    (booking: Record<string, unknown>) => {
      router.push({
        pathname: '/influencer/booking-deliver',
        params: {
          bookingId: String(booking.id),
          title: labelForContentType(String(booking.contentType)),
        },
      } as never);
    },
    [router]
  );

  const keyExtractor = useCallback((row: Row) => String(row.booking.id), []);

  const renderRow = useCallback(
    ({ item }: ListRenderItemInfo<Row>) => {
      const { booking, brand, deliverable } = item;
      const id = String(booking.id);
      const status = String(booking.status);
      const contentType = String(booking.contentType ?? '');
      const brandName = brand?.name ?? 'Brand';
      const pill = bookingStatusShort(status, deliverable);
      const tone = bookingStatusTone(status, deliverable);
      const st = statusColors(tone, kollab);
      const pending = status === 'pending';
      const deliver = canDeliver(status, deliverable);
      const highlighted = Boolean(highlightBookingId && highlightBookingId === id);

      return (
        <View
          style={[
            styles.card,
            { backgroundColor: kollab.color.card },
            kollab.shadow.card,
            highlighted && { borderWidth: 1.5, borderColor: kollab.color.violet },
          ]}
        >
          <View style={styles.top}>
            <View style={[styles.logo, { backgroundColor: kollab.color.panel }]}>
              <Text style={[styles.logoText, { color: kollab.color.panelInk }]}>
                {initials(brandName)}
              </Text>
            </View>
            <View style={styles.copy}>
              <Text style={[styles.brand, { color: kollab.color.ink }]} numberOfLines={1}>
                {brandName}
              </Text>
              <Text style={[styles.item, { color: kollab.color.ink }]} numberOfLines={1}>
                {labelForContentType(contentType)}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={[styles.amount, { color: kollab.color.ink }]}>
                {formatInr(Number(booking.totalAmount ?? 0))}
              </Text>
              <View style={[styles.status, { backgroundColor: st.bg }]}>
                <Text style={[styles.statusText, { color: st.fg }]}>{pill}</Text>
              </View>
            </View>
          </View>
          {pending ? (
            <View style={[styles.footer, { borderTopColor: kollab.color.hairline }]}>
              <KollabButton
                label="Decline"
                variant="hairline"
                compact
                style={styles.action}
                disabled={busyId === id}
                onPress={() => setSheet({ kind: 'decline', id })}
              />
              <KollabButton
                label="Accept"
                variant="ink"
                compact
                style={styles.action}
                disabled={busyId === id}
                onPress={() => acceptBooking(id)}
              />
            </View>
          ) : null}
          {status === 'accepted' || status === 'in_progress' ? (
            <View style={[styles.footer, { borderTopColor: kollab.color.hairline }]}>
              <KollabButton
                label={status === 'accepted' ? 'Cancel booking' : 'Ask to cancel'}
                variant="hairline"
                compact
                onPress={() => setSheet({ kind: 'cancel', id, inProgress: status === 'in_progress' })}
              />
            </View>
          ) : null}
          {status === 'cancel_requested' ? (
            <View style={[styles.footer, { borderTopColor: kollab.color.hairline }]}>
              <Text style={{ color: kollab.color.inkMuted, fontFamily: font.body, fontSize: 12.5, flex: 1 }}>
                You asked to cancel. Waiting for the brand to agree.
              </Text>
            </View>
          ) : null}
          {status === 'declined' || status === 'cancelled' || status === 'cancel_requested' ? (
            <View style={[styles.footer, { borderTopColor: kollab.color.hairline, flexDirection: 'column', alignItems: 'flex-start', gap: 2 }]}>
              <Text style={{ color: kollab.color.ink, fontFamily: font.semiBold, fontSize: 12.5 }}>
                Reason:{' '}
                <Text style={{ fontFamily: font.body }}>
                  {typeof booking.statusReasonLabel === 'string' && booking.statusReasonLabel
                    ? booking.statusReasonLabel
                    : 'No reason was recorded'}
                </Text>
              </Text>
              {typeof booking.statusNote === 'string' && booking.statusNote.trim() ? (
                <Text style={{ color: kollab.color.inkMuted, fontFamily: font.body, fontSize: 12.5 }}>
                  Note: {booking.statusNote.trim()}
                </Text>
              ) : null}
              {formatDateTime((booking.statusChangedAt ?? booking.updatedAt) as string) ? (
                <Text style={{ color: kollab.color.inkMuted, fontFamily: font.body, fontSize: 12 }}>
                  {formatDateTime((booking.statusChangedAt ?? booking.updatedAt) as string)}
                </Text>
              ) : null}
            </View>
          ) : null}
          {deliver ? (
            <View style={[styles.footer, { borderTopColor: kollab.color.hairline }]}>
              <KollabButton label="Deliver content" compact onPress={() => openDeliver(booking)} />
            </View>
          ) : null}
        </View>
      );
    },
    [highlightBookingId, openDeliver, acceptBooking, busyId, kollab]
  );

  const listHeader = (
    <>
      {showHeader ? (
        <KollabScreenHeader
          title="Price card bookings"
          subtitle="Direct requests from your price card"
        />
      ) : null}
      {error ? (
        <View style={[styles.errorBox, { backgroundColor: kollab.color.heatTint }]}>
          <Text style={[styles.errorText, { color: kollab.color.heat }]}>{error}</Text>
          <KollabButton label="Retry" compact onPress={() => void load()} />
        </View>
      ) : null}
      {loading && !refreshing ? (
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 16 }} />
      ) : null}
    </>
  );

  const listEmpty =
    loading || error ? null : (
      <Text style={[styles.empty, { color: kollab.color.ink }]}>No booking requests yet.</Text>
    );

  const listFooter = (
    <KollabButton
      label="Open Price Card"
      variant="hairline"
      onPress={() => router.push('/account-screens/rate-card' as never)}
      style={styles.priceCardBtn}
    />
  );

  const confirmSheet = async (reason: string, note: string) => {
    if (!sheet) return;
    try {
      if (sheet.kind === 'decline') {
        await respond(sheet.id, 'declined', { reason, note: note || undefined });
      } else {
        const res = (await rateCardsApi.cancelBooking(sheet.id, { reason, note: note || undefined })) as {
          mode?: 'direct' | 'request';
        };
        await load(true);
        showKollabToast(
          res.mode === 'request'
            ? 'Cancel request sent. The brand needs to agree.'
            : 'Booking cancelled. The brand has been told.'
        );
      }
      setSheet(null);
    } catch (e) {
      // The sheet shows this message inside itself (a toast would be drawn behind the sheet).
      throw e instanceof Error ? e : new Error('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <FlatList
        data={rows}
        extraData={busyId}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={kollab.color.ink}
          />
        }
        contentContainerStyle={[styles.listContent, { paddingTop: showHeader ? 0 : insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      />
      <ReasonSheet
        visible={sheet !== null}
        title={
          sheet?.kind === 'decline'
            ? 'Decline this booking?'
            : sheet?.inProgress
              ? 'Ask the brand to cancel?'
              : 'Cancel this booking?'
        }
        message={
          sheet?.kind === 'decline'
            ? 'Tell the brand why. They will see your reason.'
            : sheet?.inProgress
              ? 'Work has already started, so the booking is only cancelled if the brand agrees.'
              : 'Nothing has been delivered yet, so this cancels the booking right away and the brand is told.'
        }
        reasons={sheet?.kind === 'decline' ? DECLINE_REASONS : CANCEL_REASONS}
        confirmLabel={
          sheet?.kind === 'decline' ? 'Decline booking' : sheet?.inProgress ? 'Send request' : 'Cancel booking'
        }
        cancelLabel={sheet?.kind === 'decline' ? 'Go back' : 'Keep booking'}
        onConfirm={confirmSheet}
        onClose={() => setSheet(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: space.gutter,
    paddingBottom: space.xl,
  },
  card: { borderRadius: 22, paddingVertical: 16, paddingHorizontal: 18, marginBottom: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontFamily: font.bold, fontSize: 12 },
  copy: { flex: 1, minWidth: 0 },
  brand: { fontFamily: font.semiBold, fontSize: 14 },
  item: { fontFamily: font.body, fontSize: 11.5, opacity: 0.55, marginTop: 1 },
  right: { alignItems: 'flex-end', flexShrink: 0 },
  amount: { ...kType.rowTitle },
  status: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, marginTop: 3 },
  statusText: { fontFamily: font.bold, fontSize: 10.5 },
  footer: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  action: { flex: 1 },
  empty: { fontFamily: font.body, fontSize: 13, opacity: 0.55, marginBottom: 16 },
  errorBox: { borderRadius: 16, padding: 14, gap: 8, marginBottom: 12 },
  errorText: { fontFamily: font.body, fontSize: 13 },
  priceCardBtn: { marginTop: 6, marginBottom: 20 },
});
