import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { PremiumOpportunityCard, SectionHeader } from '@/components/ui';
import { rateCardsApi } from '@/lib/rate-cards-api';
import {
  bookingStatusShort,
  bookingStatusTone,
  labelForContentType,
  platformForContentType,
} from '@/lib/opportunity-card-ui';
import { appShell, radius, spacing } from '@/theme';

type Deliverable = { status?: string; brandFeedback?: string | null };

function canDeliver(status: string, deliverable?: Deliverable | null): boolean {
  if (status === 'accepted') return true;
  return status === 'in_progress' && deliverable?.status === 'revision_requested';
}

type Row = {
  booking: Record<string, unknown>;
  brand?: { name?: string };
  deliverable?: Deliverable | null;
};

export function BookingsList({
  showHeader = true,
  highlightBookingId,
  refreshSignal,
  onRefreshDone,
}: {
  showHeader?: boolean;
  highlightBookingId?: string;
  refreshSignal?: boolean;
  onRefreshDone?: () => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!refreshSignal) return;
    void load(true).finally(() => onRefreshDone?.());
  }, [refreshSignal, load, onRefreshDone]);

  const respond = async (id: string, status: 'accepted' | 'declined') => {
    try {
      await rateCardsApi.respondBooking(id, status);
      const message =
        status === 'accepted'
          ? 'Booking accepted. Submit your content when ready — payment is held in escrow until the brand approves.'
          : 'Booking declined.';
      setError(null);
      await load(true);
      Alert.alert('Done', message);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      setError(msg);
    }
  };

  const openDeliver = (booking: Record<string, unknown>) => {
    router.push({
      pathname: '/influencer/booking-deliver',
      params: {
        bookingId: String(booking.id),
        title: labelForContentType(String(booking.contentType)),
      },
    } as never);
  };

  const showEmptyRateCardCta = rows.length === 0 && !error && !loading;

  return (
    <View>
      {showHeader ? (
        <SectionHeader
          title="PriceCard Bookings"
          subtitle="Direct requests from brands at your price card prices"
        />
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading && !refreshing ? (
        <ActivityIndicator color={appShell.cta} style={{ marginTop: spacing.lg }} />
      ) : rows.length === 0 && !error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No booking requests yet.</Text>
          {showEmptyRateCardCta ? (
            <>
              <Text style={styles.emptyHint}>
                Enable Public price card and Open for direct bookings in your Price Card settings.
              </Text>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => router.push('/account-screens/rate-card' as never)}
              >
                <Text style={styles.linkBtnText}>Open Price Card</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      ) : (
        rows.map(({ booking, brand, deliverable }) => {
          const id = String(booking.id);
          const status = String(booking.status);
          const contentType = String(booking.contentType ?? '');
          const brandName = brand?.name ?? 'Brand';
          const qty = String(booking.quantity ?? 1);
          const tone = bookingStatusTone(status, deliverable);
          const pill = bookingStatusShort(status, deliverable);
          const platform = platformForContentType(contentType);
          const quote =
            deliverable?.brandFeedback && deliverable.status === 'revision_requested'
              ? deliverable.brandFeedback
              : booking.messageFromBrand
                ? String(booking.messageFromBrand)
                : undefined;
          const quoteLabel =
            deliverable?.brandFeedback && deliverable.status === 'revision_requested'
              ? 'Brand feedback'
              : quote
                ? 'Brand note'
                : undefined;

          const footer = (
            <>
              {status === 'pending' ? (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.btn} onPress={() => void respond(id, 'accepted')}>
                    <Text style={styles.btnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnOutline]}
                    onPress={() => void respond(id, 'declined')}
                  >
                    <Text style={[styles.btnText, styles.outlineText]}>Decline</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {canDeliver(status, deliverable) ? (
                <TouchableOpacity style={styles.btn} onPress={() => openDeliver(booking)}>
                  <Text style={styles.btnText}>Deliver content</Text>
                </TouchableOpacity>
              ) : null}
            </>
          );

          const hasFooter = status === 'pending' || canDeliver(status, deliverable);
          const canOpenDeliver = canDeliver(status, deliverable);

          return (
            <PremiumOpportunityCard
              key={id}
              highlighted={Boolean(highlightBookingId && highlightBookingId === id)}
              title={labelForContentType(contentType)}
              subtitle={`${brandName} · Direct booking`}
              platform={platform === 'ugc' ? 'ugc' : platform}
              statusLabel={pill}
              statusTone={tone}
              amountPrimary={`₹${Number(booking.totalAmount ?? 0).toLocaleString('en-IN')}`}
              amountSecondary={`Qty ${qty}`}
              quote={quote}
              quoteLabel={quoteLabel}
              showChevron={canOpenDeliver && !hasFooter}
              onPress={canOpenDeliver && !hasFooter ? () => openDeliver(booking) : undefined}
              footer={hasFooter ? footer : undefined}
            />
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { marginTop: spacing.md, gap: spacing.sm },
  emptyText: { fontFamily: 'Inter_600SemiBold', color: appShell.textPrimary },
  emptyHint: { fontFamily: 'Inter_400Regular', color: appShell.textSecondary, lineHeight: 20 },
  linkBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: appShell.cta,
  },
  linkBtnText: { color: '#fff', fontFamily: 'Inter_600SemiBold' },
  errorBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  errorText: { fontFamily: 'Inter_400Regular', color: '#b91c1c', lineHeight: 20 },
  retryBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  retryText: { fontFamily: 'Inter_600SemiBold', color: appShell.cta },
  actions: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1,
    backgroundColor: appShell.cta,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: appShell.cta },
  btnText: { color: '#fff', fontFamily: 'Inter_600SemiBold' },
  outlineText: { color: appShell.cta },
});
