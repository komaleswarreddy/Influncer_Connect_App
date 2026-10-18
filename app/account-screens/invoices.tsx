import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  KollabEmptyCard,
  KollabScreenHeader,
  KollabSegmented,
  KollabStatTile,
  KollabStatusChip,
  ScrollScreen,
} from '@/components/ui';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { useInvoicesStore } from '@/store/invoices-store';
import type { Invoice, InvoiceListFilter } from '@/lib/invoices-api';
import { INVOICE_STATUS_UI } from '@/lib/invoice-ui';
import { formatInvoiceMoney, formatIsoDate } from '@/lib/invoice-math';
import { formatInr } from '@/lib/currency';
import { font, useKollab } from '@/theme/kollab-tokens';

type Tab = 'create' | 'history';

const TABS = [
  { key: 'create', label: 'Create' },
  { key: 'history', label: 'History' },
];

const FILTERS: { key: InvoiceListFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'sent', label: 'Sent' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function InvoicesScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const params = useLocalSearchParams<{
    tab?: string;
    brandName?: string;
    brandEmail?: string;
    contactName?: string;
  }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'history' ? 'history' : 'create');
  const { invoices, summary, filter, isLoading, error, setFilter, fetchInvoices } =
    useInvoicesStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.tab === 'history' || params.tab === 'create') setTab(params.tab);
  }, [params.tab]);

  // Refresh whenever the History tab is in view (including coming back from a detail or edit screen).
  useFocusEffect(
    useCallback(() => {
      if (tab === 'history') void fetchInvoices();
    }, [tab, fetchInvoices])
  );

  const openInvoice = (invoice: Invoice) =>
    router.push(`/account-screens/invoice-detail?id=${invoice.id}` as never);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  };

  const changeFilter = (next: InvoiceListFilter) => {
    setFilter(next);
    void fetchInvoices(next);
  };

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{
        keyboardShouldPersistTaps: 'handled',
        refreshControl:
          tab === 'history' ? (
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          ) : undefined,
      }}
    >
      <KollabScreenHeader title="Invoices" subtitle="Track all your invoices and payments" />
      <KollabSegmented
        segments={TABS}
        value={tab}
        onChange={(k) => setTab(k as Tab)}
        style={styles.tabs}
      />

      {tab === 'create' ? (
        <InvoiceForm
          mode="create"
          prefill={{
            brandName: typeof params.brandName === 'string' ? params.brandName : undefined,
            brandEmail: typeof params.brandEmail === 'string' ? params.brandEmail : undefined,
            contactName: typeof params.contactName === 'string' ? params.contactName : undefined,
          }}
          onSaved={(invoice) =>
            router.replace(`/account-screens/invoice-detail?id=${invoice.id}` as never)
          }
        />
      ) : (
        <View style={styles.history}>
          <View style={styles.tiles}>
            <KollabStatTile
              label="Outstanding"
              value={formatInr(summary.outstanding)}
              delta={
                summary.overdueCount > 0
                  ? `${summary.overdueCount} overdue · ${formatInr(summary.overdueAmount)}`
                  : 'nothing overdue'
              }
              fill="dark"
              style={styles.tile}
            />
            <KollabStatTile
              label="Paid"
              value={formatInr(summary.paidTotal)}
              delta={`${summary.totalCount} invoice${summary.totalCount === 1 ? '' : 's'}`}
              fill="tint"
              style={styles.tile}
            />
          </View>

          <View style={styles.filters}>
            {FILTERS.map((f) => {
              const on = filter === f.key;
              const spec = kollab.choiceChip;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => changeFilter(f.key)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: on ? spec.selectedBg : spec.idleBg,
                      borderColor: on ? spec.selectedBorder : spec.idleBorder,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.filterText, { color: on ? spec.selectedFg : spec.idleFg }]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isLoading && invoices.length === 0 ? (
            <ActivityIndicator color={kollab.color.ink} style={{ marginTop: 24 }} />
          ) : error && invoices.length === 0 ? (
            <KollabEmptyCard
              title="Couldn’t load invoices"
              subtitle={error}
              ctaLabel="Try again"
              onPress={() => void fetchInvoices()}
              style={styles.empty}
            />
          ) : invoices.length === 0 ? (
            <KollabEmptyCard
              title={filter === 'all' ? 'No invoices yet' : 'Nothing here'}
              subtitle={
                filter === 'all'
                  ? 'Create your first invoice and send it to a brand in a minute.'
                  : 'No invoices match this filter.'
              }
              ctaLabel={filter === 'all' ? 'Create invoice' : 'Show all'}
              onPress={() => (filter === 'all' ? setTab('create') : changeFilter('all'))}
              style={styles.empty}
            />
          ) : (
            <View style={styles.list}>
              {invoices.map((inv) => {
                const ui = INVOICE_STATUS_UI[inv.displayStatus];
                return (
                  <Pressable
                    key={inv.id}
                    onPress={() => openInvoice(inv)}
                    style={[
                      styles.card,
                      { backgroundColor: kollab.color.card },
                      kollab.shadow.card,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Invoice ${inv.invoiceNumber} for ${inv.brandName}`}
                  >
                    <View style={styles.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.cardBrand, { color: kollab.color.ink }]}
                          numberOfLines={1}
                        >
                          {inv.brandName}
                        </Text>
                        <Text style={[styles.cardMeta, { color: kollab.color.ink }]}>
                          {inv.invoiceNumber} · due {formatIsoDate(inv.dueDate)}
                        </Text>
                      </View>
                      <KollabStatusChip tone={ui.tone} label={ui.label} />
                    </View>
                    <Text style={[styles.cardTotal, { color: kollab.color.ink }]}>
                      {formatInvoiceMoney(inv.total, inv.currency)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  tabs: { marginBottom: 16 },
  history: { gap: 14 },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  filterText: { fontFamily: font.semiBold, fontSize: 12.5 },
  empty: { marginHorizontal: 0 },
  list: { gap: 10 },
  card: { borderRadius: 22, padding: 16, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardBrand: { fontFamily: font.bold, fontSize: 15.5 },
  cardMeta: { fontFamily: font.body, fontSize: 12.5, opacity: 0.55, marginTop: 2 },
  cardTotal: { fontFamily: font.display, fontSize: 24 },
});
