import { openExternalUrl } from '../../lib/safe-link';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  KollabButton,
  KollabEmptyCard,
  KollabScreenHeader,
  KollabStatusChip,
  ScrollScreen,
  showKollabConfirm,
  showKollabToast,
} from '@/components/ui';
import { meetsApi, type MeetBooking } from '@/lib/meets-api';
import { BOOKING_STATUS_UI, formatSessionRange } from '@/lib/meets-ui';
import { formatInr } from '@/lib/currency';
import { font, useKollab } from '@/theme/kollab-tokens';

export default function MeetBookingDetailScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const bookingId = typeof id === 'string' ? id : '';
  const [booking, setBooking] = useState<MeetBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setBooking((await meetsApi.booking(bookingId)).booking);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open this booking');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const cancel = async () => {
    if (!booking) return;
    const paid = booking.totalAmount > 0;
    const ok = await showKollabConfirm({
      title: 'Cancel this session?',
      message: paid
        ? `${booking.buyerName} will get a full refund of ${formatInr(booking.totalAmount)} and be told by email.`
        : `${booking.buyerName} will be told by email.`,
      confirmLabel: 'Cancel session',
      cancelLabel: 'Keep it',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      setBooking((await meetsApi.cancelBooking(booking.id)).booking);
      showKollabToast('Session cancelled');
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not cancel the session');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!booking?.meetUrl) return;
    try {
      await Clipboard.setStringAsync(booking.meetUrl);
      showKollabToast('Meet link copied');
    } catch {
      showKollabToast('Could not copy the link');
    }
  };
  const shareLink = async () => {
    if (!booking?.meetUrl) return;
    try {
      await Share.share({ message: `Join our session: ${booking.meetUrl}` });
    } catch {
      showKollabToast('Could not open the share sheet');
    }
  };

  if (loading) {
    return (
      <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
        <KollabScreenHeader title="Booking" />
        <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />
      </ScrollScreen>
    );
  }
  if (!booking) {
    return (
      <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
        <KollabScreenHeader title="Booking" />
        <KollabEmptyCard
          title="Couldn’t open this booking"
          subtitle={error ?? 'It may no longer exist.'}
          ctaLabel="Back to bookings"
          onPress={() => router.replace('/account-screens/meet-bookings' as never)}
          style={{ marginHorizontal: 0 }}
        />
      </ScrollScreen>
    );
  }

  const ui = BOOKING_STATUS_UI[booking.status];
  const upcoming =
    booking.status === 'confirmed' && new Date(booking.startsAt).getTime() > Date.now();

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
      <KollabScreenHeader title="Booking" />
      <View style={styles.body}>
        <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
          <View style={styles.top}>
            <Text style={[styles.title, { color: c.ink }]}>{booking.serviceTitle}</Text>
            <KollabStatusChip tone={ui.tone} label={ui.label} />
          </View>
          <Text style={[styles.when, { color: c.violetDeep }]}>
            {formatSessionRange(booking.startsAt, booking.endsAt)}
          </Text>
          <Row label="Booked by" value={booking.buyerName} />
          <Row label="Email" value={booking.buyerEmail} />
          {booking.buyerPhone ? <Row label="Phone" value={booking.buyerPhone} /> : null}
          <Row
            label="Amount"
            value={booking.totalAmount > 0 ? formatInr(booking.totalAmount) : 'Free'}
          />
          {booking.totalAmount > 0 && booking.platformFee > 0 ? (
            <Row label="Platform fee" value={formatInr(booking.platformFee)} />
          ) : null}
          {booking.rescheduleCount > 0 ? (
            <Row
              label="Rescheduled"
              value={`${booking.rescheduleCount} time${booking.rescheduleCount === 1 ? '' : 's'}`}
            />
          ) : null}
          {booking.status === 'cancelled' ? (
            <Row
              label="Cancelled by"
              value={booking.cancelledBy === 'creator' ? 'You' : 'The booker'}
            />
          ) : null}
          {booking.refundStatus !== 'none' ? (
            <Row
              label="Refund"
              value={`${formatInr(booking.refundAmount)} · ${booking.refundStatus === 'refunded' ? 'sent' : booking.refundStatus === 'failed' ? 'retrying' : 'in progress'}`}
            />
          ) : null}
        </View>

        {booking.status === 'confirmed' ? (
          <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
            <Text style={[styles.label, { color: c.ink }]}>Joining link</Text>
            {booking.meetUrl ? (
              <>
                <Text style={[styles.link, { color: c.violetDeep }]} selectable>
                  {booking.meetUrl}
                </Text>
                <View style={styles.row}>
                  <KollabButton
                    label="Join"
                    variant="primary"
                    compact
                    onPress={() =>
                      void openExternalUrl(booking.meetUrl).catch(() =>
                        showKollabToast('Could not open the link')
                      )
                    }
                    style={styles.flex}
                  />
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
                </View>
              </>
            ) : (
              <Text style={[styles.note, { color: c.ink }]}>
                No Meet link yet. Connect Google Calendar in Meet scheduler so every booking gets
                one, or message {booking.buyerName} your own joining link.
              </Text>
            )}
          </View>
        ) : null}

        {upcoming ? (
          <KollabButton
            label="Cancel session"
            variant="hairline"
            onPress={() => void cancel()}
            loading={busy}
          />
        ) : null}
      </View>
    </ScrollScreen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const kollab = useKollab();
  return (
    <View style={styles.kv}>
      <Text style={[styles.k, { color: kollab.color.ink }]}>{label}</Text>
      <Text style={[styles.v, { color: kollab.color.ink }]} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { gap: 12 },
  card: { borderRadius: 22, padding: 16, gap: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, fontFamily: font.bold, fontSize: 18 },
  when: { fontFamily: font.bold, fontSize: 14.5, marginBottom: 4 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  k: { fontFamily: font.body, fontSize: 13.5, opacity: 0.55 },
  v: { flexShrink: 1, fontFamily: font.bold, fontSize: 13.5, textAlign: 'right' },
  label: { fontFamily: font.bold, fontSize: 15 },
  link: { fontFamily: font.bold, fontSize: 14 },
  note: { fontFamily: font.body, fontSize: 13.5, opacity: 0.65, lineHeight: 19 },
  row: { flexDirection: 'row', gap: 10 },
});
