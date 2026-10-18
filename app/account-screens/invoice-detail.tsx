import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  KollabButton,
  KollabEmptyCard,
  KollabScreenHeader,
  KollabStatusChip,
  KollabTextField,
  ScrollScreen,
  showKollabConfirm,
  showKollabToast,
} from '@/components/ui';
import { invoicesApi, type Invoice } from '@/lib/invoices-api';
import { INVOICE_STATUS_UI } from '@/lib/invoice-ui';
import { formatInvoiceMoney, formatIsoDate, isValidEmail } from '@/lib/invoice-math';
import { font, useKollab } from '@/theme/kollab-tokens';

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const { id } = useLocalSearchParams<{ id: string }>();
  const invoiceId = typeof id === 'string' ? id : '';

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendMessage, setSendMessage] = useState('');

  const load = useCallback(async () => {
    if (!invoiceId) {
      setLoadError('Invoice not found');
      setLoading(false);
      return;
    }
    try {
      const res = await invoicesApi.get(invoiceId);
      setInvoice(res.invoice);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load this invoice');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

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

  const openSend = () => {
    if (!invoice) return;
    setSendTo(invoice.brandEmail ?? '');
    setSendMessage('');
    setSendOpen(true);
  };

  const confirmSend = () =>
    run('send', async () => {
      if (!invoice) return;
      const to = sendTo.trim();
      if (!to || !isValidEmail(to)) {
        showKollabToast('Enter the brand’s email address');
        return;
      }
      const res = await invoicesApi.send(invoice.id, {
        to: to !== invoice.brandEmail ? to : undefined,
        message: sendMessage.trim() || undefined,
      });
      setInvoice(res.invoice);
      setSendOpen(false);
      showKollabToast(`Sent to ${res.emailedTo}`);
    });

  const openPdf = () =>
    run('pdf', async () => {
      if (!invoice) return;
      const url = await invoicesApi.pdfUrl(invoice.id);
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error('No app on this device can open the PDF');
      await Linking.openURL(url);
    });

  const markPaid = async () => {
    if (!invoice) return;
    const ok = await showKollabConfirm({
      title: 'Mark as paid?',
      message: `Record ${invoice.invoiceNumber} (${formatInvoiceMoney(invoice.total, invoice.currency)}) as paid. This can’t be undone.`,
      confirmLabel: 'Mark paid',
    });
    if (!ok) return;
    await run('paid', async () => {
      const res = await invoicesApi.markPaid(invoice.id);
      setInvoice(res.invoice);
      showKollabToast('Marked as paid');
    });
  };

  const cancelInvoice = async () => {
    if (!invoice) return;
    const ok = await showKollabConfirm({
      title: 'Cancel this invoice?',
      message: 'It stays in your history as cancelled. This can’t be undone.',
      confirmLabel: 'Cancel invoice',
      cancelLabel: 'Keep it',
      destructive: true,
    });
    if (!ok) return;
    await run('cancel', async () => {
      const res = await invoicesApi.cancel(invoice.id);
      setInvoice(res.invoice);
      showKollabToast('Invoice cancelled');
    });
  };

  const deleteInvoice = async () => {
    if (!invoice) return;
    const ok = await showKollabConfirm({
      title: 'Delete this invoice?',
      message: `${invoice.invoiceNumber} will be removed permanently.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await run('delete', async () => {
      await invoicesApi.remove(invoice.id);
      showKollabToast('Invoice deleted');
      router.replace('/account-screens/invoices?tab=history' as never);
    });
  };

  if (loading) {
    return (
      <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
        <KollabScreenHeader title="Invoice" />
        <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />
      </ScrollScreen>
    );
  }

  if (!invoice) {
    return (
      <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
        <KollabScreenHeader title="Invoice" />
        <KollabEmptyCard
          title="Couldn’t open this invoice"
          subtitle={loadError ?? 'It may have been deleted.'}
          ctaLabel="Back to invoices"
          onPress={() => router.replace('/account-screens/invoices?tab=history' as never)}
          style={{ marginHorizontal: 0 }}
        />
      </ScrollScreen>
    );
  }

  const ui = INVOICE_STATUS_UI[invoice.displayStatus];
  const status = invoice.status;
  const items = invoice.items ?? [];
  const money = (n: number) => formatInvoiceMoney(n, invoice.currency);

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
    >
      <KollabScreenHeader title={invoice.invoiceNumber} subtitle={invoice.brandName} />

      <View style={[styles.hero, { backgroundColor: c.panel }]}>
        <KollabStatusChip tone={ui.tone} label={ui.label} />
        <Text style={[styles.heroTotal, { color: c.panelInk }]}>{money(invoice.total)}</Text>
        <Text style={[styles.heroMeta, { color: c.panelInk }]}>
          Issued {formatIsoDate(invoice.issueDate)} · Due {formatIsoDate(invoice.dueDate)}
        </Text>
        {invoice.sentAt ? (
          <Text style={[styles.heroMeta, { color: c.panelInk }]}>
            Sent {formatIsoDate(invoice.sentAt.slice(0, 10))}
            {invoice.paidAt ? ` · Paid ${formatIsoDate(invoice.paidAt.slice(0, 10))}` : ''}
          </Text>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
        <Text style={[styles.cardTitle, { color: c.ink }]}>Bill to</Text>
        <Text style={[styles.strong, { color: c.ink }]}>{invoice.brandName}</Text>
        {invoice.contactName ? (
          <Text style={[styles.line, { color: c.ink }]}>Attn: {invoice.contactName}</Text>
        ) : null}
        {invoice.brandEmail ? (
          <Text style={[styles.line, { color: c.ink }]}>{invoice.brandEmail}</Text>
        ) : null}
        {invoice.billingAddress ? (
          <Text style={[styles.line, { color: c.ink }]}>{invoice.billingAddress}</Text>
        ) : null}
        {invoice.brandGstin ? (
          <Text style={[styles.line, { color: c.ink }]}>GSTIN {invoice.brandGstin}</Text>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
        <Text style={[styles.cardTitle, { color: c.ink }]}>Deliverables</Text>
        {items.map((item, i) => (
          <View
            key={item.id ?? i}
            style={[
              styles.itemRow,
              i > 0 && { borderTopColor: c.hairline, borderTopWidth: StyleSheet.hairlineWidth },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.strong, { color: c.ink }]}>{item.description}</Text>
              <Text style={[styles.line, { color: c.ink }]}>
                {item.quantity} × {money(item.unitPrice)}
              </Text>
            </View>
            <Text style={[styles.strong, { color: c.ink }]}>{money(item.amount)}</Text>
          </View>
        ))}
        <View style={[styles.sumBlock, { borderTopColor: c.hairline }]}>
          <SumRow label="Subtotal" value={money(invoice.subtotal)} color={c.ink} />
          {invoice.discountAmount > 0 ? (
            <SumRow
              label={
                invoice.discountType === 'percent'
                  ? `Discount (${invoice.discountValue}%)`
                  : 'Discount'
              }
              value={`− ${money(invoice.discountAmount)}`}
              color={c.ink}
            />
          ) : null}
          {invoice.taxPercent > 0 ? (
            <SumRow
              label={`${invoice.taxLabel} (${invoice.taxPercent}%)`}
              value={money(invoice.taxAmount)}
              color={c.ink}
            />
          ) : null}
          <SumRow label="Total" value={money(invoice.total)} color={c.ink} big />
        </View>
      </View>

      {invoice.paymentDetails || invoice.notes ? (
        <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
          {invoice.paymentDetails ? (
            <>
              <Text style={[styles.cardTitle, { color: c.ink }]}>Payment details</Text>
              <Text style={[styles.line, { color: c.ink }]}>{invoice.paymentDetails}</Text>
            </>
          ) : null}
          {invoice.notes ? (
            <>
              <Text
                style={[
                  styles.cardTitle,
                  { color: c.ink, marginTop: invoice.paymentDetails ? 8 : 0 },
                ]}
              >
                Notes
              </Text>
              <Text style={[styles.line, { color: c.ink }]}>{invoice.notes}</Text>
            </>
          ) : null}
        </View>
      ) : null}

      {sendOpen ? (
        <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
          <Text style={[styles.cardTitle, { color: c.ink }]}>
            {status === 'sent' ? 'Resend invoice' : 'Email invoice'}
          </Text>
          <Text style={[styles.line, { color: c.ink }]}>
            The PDF is attached. The brand can reply straight to you.
          </Text>
          <KollabTextField
            surface="well"
            value={sendTo}
            onChangeText={setSendTo}
            placeholder="brand@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <KollabTextField
            surface="well"
            value={sendMessage}
            onChangeText={setSendMessage}
            placeholder="Add a short message (optional)"
            multiline
            maxLength={2000}
          />
          <View style={styles.row}>
            <KollabButton
              label="Cancel"
              variant="soft"
              compact
              onPress={() => setSendOpen(false)}
              style={styles.flex}
            />
            <KollabButton
              label="Send now"
              variant="ink"
              compact
              loading={busy === 'send'}
              onPress={() => void confirmSend()}
              style={styles.flex}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        {status === 'draft' || status === 'sent' ? (
          <KollabButton
            label={status === 'sent' ? 'Resend by email' : 'Send to brand'}
            variant="ink"
            onPress={openSend}
            disabled={sendOpen}
          />
        ) : null}
        {status === 'draft' ? (
          <KollabButton
            label="Edit draft"
            variant="soft"
            onPress={() => router.push(`/account-screens/invoice-edit?id=${invoice.id}` as never)}
          />
        ) : null}
        {status === 'draft' || status === 'sent' ? (
          <KollabButton
            label="Mark as paid"
            variant="soft"
            loading={busy === 'paid'}
            onPress={() => void markPaid()}
          />
        ) : null}
        <KollabButton
          label="Download PDF"
          variant="hairline"
          loading={busy === 'pdf'}
          onPress={() => void openPdf()}
        />
        {status === 'draft' || status === 'sent' ? (
          <KollabButton
            label="Cancel invoice"
            variant="hairline"
            loading={busy === 'cancel'}
            onPress={() => void cancelInvoice()}
          />
        ) : null}
        {status === 'draft' || status === 'cancelled' ? (
          <KollabButton
            label="Delete"
            variant="hairline"
            loading={busy === 'delete'}
            onPress={() => void deleteInvoice()}
          />
        ) : null}
      </View>
    </ScrollScreen>
  );
}

function SumRow({
  label,
  value,
  color,
  big,
}: {
  label: string;
  value: string;
  color: string;
  big?: boolean;
}) {
  return (
    <View style={styles.sumRow}>
      <Text style={[big ? styles.sumBigLabel : styles.line, { color }]}>{label}</Text>
      <Text style={[big ? styles.sumBigValue : styles.strong, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 26, padding: 20, gap: 8, marginBottom: 14 },
  heroTotal: { fontFamily: font.display, fontSize: 38 },
  heroMeta: { fontFamily: font.body, fontSize: 13, opacity: 0.75 },
  card: { borderRadius: 22, padding: 16, gap: 6, marginBottom: 12 },
  cardTitle: { fontFamily: font.bold, fontSize: 14, opacity: 0.6, marginBottom: 2 },
  strong: { fontFamily: font.semiBold, fontSize: 14.5 },
  line: { fontFamily: font.body, fontSize: 13.5, opacity: 0.7 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  sumBlock: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, marginTop: 4, gap: 6 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sumBigLabel: { fontFamily: font.bold, fontSize: 16 },
  sumBigValue: { fontFamily: font.display, fontSize: 24 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  actions: { gap: 10, marginTop: 6 },
});
