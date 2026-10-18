import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Glyph,
  KollabButton,
  KollabSegmented,
  KollabTextField,
  showKollabToast,
} from '@/components/ui';
import ScheduleDateTimeSheet, {
  dateToScheduleValue,
  type ScheduleDateTimeValue,
} from '@/components/scheduler/ScheduleDateTimeSheet';
import {
  invoicesApi,
  type Invoice,
  type InvoiceDiscountType,
  type InvoiceInput,
} from '@/lib/invoices-api';
import {
  addDaysIso,
  computeInvoicePreview,
  formatInvoiceMoney,
  formatIsoDate,
  isValidEmail,
  isoToLocalDate,
  parseAmount,
  toIsoDate,
} from '@/lib/invoice-math';
import { font, useKollab } from '@/theme/kollab-tokens';

type ItemRow = { key: string; description: string; quantity: string; unitPrice: string };

const NET_TERMS = [7, 15, 30, 45] as const;
const TAX_PRESETS = [0, 5, 12, 18, 28] as const;
const DISCOUNT_SEGMENTS = [
  { key: 'none', label: 'None' },
  { key: 'percent', label: '% off' },
  { key: 'flat', label: 'Flat off' },
];

let rowSeq = 0;
const newRow = (over: Partial<ItemRow> = {}): ItemRow => ({
  key: `row-${++rowSeq}`,
  description: '',
  quantity: '1',
  unitPrice: '',
  ...over,
});

type Props = {
  mode: 'create' | 'edit';
  /** Required in edit mode: the draft being edited. */
  invoiceId?: string;
  onSaved: (invoice: Invoice) => void;
  /** Edit mode only: called when the invoice cannot be edited (not a draft / not found). */
  onUnavailable?: (message: string) => void;
  /** Create mode only: brand details to start with (e.g. from a lead). Read once, on first load. */
  prefill?: { brandName?: string; brandEmail?: string; contactName?: string };
};

export function InvoiceForm({ mode, invoiceId, onSaved, onUnavailable, prefill }: Props) {
  const prefillRef = useRef(prefill);
  const kollab = useKollab();
  const c = kollab.color;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [brandName, setBrandName] = useState('');
  const [contactName, setContactName] = useState('');
  const [brandEmail, setBrandEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [brandGstin, setBrandGstin] = useState('');
  const [issueDate, setIssueDate] = useState(toIsoDate(new Date()));
  const [dueDate, setDueDate] = useState(addDaysIso(toIsoDate(new Date()), 30));
  const [items, setItems] = useState<ItemRow[]>([newRow()]);
  const [discountType, setDiscountType] = useState<InvoiceDiscountType>('none');
  const [discountValue, setDiscountValue] = useState('');
  const [taxLabel, setTaxLabel] = useState('GST');
  const [taxPercent, setTaxPercent] = useState('0');
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [fromGstin, setFromGstin] = useState('');
  const [showFrom, setShowFrom] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [numberLabel, setNumberLabel] = useState('');
  const [dateSheetOpen, setDateSheetOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === 'edit') {
        if (!invoiceId) throw new Error('Missing invoice');
        const { invoice } = await invoicesApi.get(invoiceId);
        if (invoice.status !== 'draft') {
          onUnavailable?.('Only draft invoices can be edited');
          return;
        }
        setNumberLabel(invoice.invoiceNumber);
        setBrandName(invoice.brandName);
        setContactName(invoice.contactName ?? '');
        setBrandEmail(invoice.brandEmail ?? '');
        setBillingAddress(invoice.billingAddress ?? '');
        setBrandGstin(invoice.brandGstin ?? '');
        setIssueDate(invoice.issueDate);
        setDueDate(invoice.dueDate);
        setItems(
          (invoice.items ?? []).length
            ? (invoice.items ?? []).map((i) =>
                newRow({
                  description: i.description,
                  quantity: String(i.quantity),
                  unitPrice: String(i.unitPrice),
                })
              )
            : [newRow()]
        );
        setDiscountType(invoice.discountType);
        setDiscountValue(invoice.discountType === 'none' ? '' : String(invoice.discountValue));
        setTaxLabel(invoice.taxLabel);
        setTaxPercent(String(invoice.taxPercent));
        setFromName(invoice.fromName ?? '');
        setFromEmail(invoice.fromEmail ?? '');
        setFromAddress(invoice.fromAddress ?? '');
        setFromGstin(invoice.fromGstin ?? '');
        setPaymentDetails(invoice.paymentDetails ?? '');
        setNotes(invoice.notes ?? '');
        setCurrency(invoice.currency);
      } else {
        const d = await invoicesApi.defaults();
        setNumberLabel(d.nextInvoiceNumber);
        setIssueDate(d.today);
        setDueDate(addDaysIso(d.today, 30));
        setFromName(d.fromName ?? '');
        setFromEmail(d.fromEmail ?? '');
        setFromAddress(d.fromAddress ?? '');
        setFromGstin(d.fromGstin ?? '');
        setTaxLabel(d.taxLabel);
        setTaxPercent(String(d.taxPercent));
        setPaymentDetails(d.paymentDetails ?? '');
        setCurrency(d.currency);
        const pre = prefillRef.current;
        if (pre?.brandName) setBrandName(pre.brandName);
        if (pre?.brandEmail) setBrandEmail(pre.brandEmail);
        if (pre?.contactName) setContactName(pre.contactName);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not load the invoice form';
      if (mode === 'edit') onUnavailable?.(message);
      else showKollabToast(message);
    } finally {
      setLoading(false);
    }
  }, [mode, invoiceId, onUnavailable]);

  useEffect(() => {
    void load();
  }, [load]);

  const preview = useMemo(
    () =>
      computeInvoicePreview({
        items: items.map((r) => ({
          description: r.description,
          quantity: parseAmount(r.quantity),
          unitPrice: parseAmount(r.unitPrice),
        })),
        discountType,
        discountValue: parseAmount(discountValue),
        taxPercent: parseAmount(taxPercent),
      }),
    [items, discountType, discountValue, taxPercent]
  );

  const updateRow = (key: string, patch: Partial<ItemRow>) =>
    setItems((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!brandName.trim()) next.brandName = 'Brand name is required';
    if (brandEmail.trim() && !isValidEmail(brandEmail)) next.brandEmail = 'Enter a valid email';
    if (fromEmail.trim() && !isValidEmail(fromEmail)) next.fromEmail = 'Enter a valid email';
    if (dueDate < issueDate) next.dueDate = 'Due date cannot be before the issue date';
    const filled = items.filter((r) => r.description.trim() || parseAmount(r.unitPrice) > 0);
    if (filled.length === 0) next.items = 'Add at least one deliverable';
    for (const r of filled) {
      if (!r.description.trim()) next.items = 'Every deliverable needs a description';
      else if (parseAmount(r.quantity) <= 0) next.items = 'Quantity must be more than 0';
      else if (parseAmount(r.unitPrice) <= 0) next.items = 'Every deliverable needs a rate';
    }
    if (discountType === 'percent' && parseAmount(discountValue) > 100) {
      next.discount = 'A percent discount cannot be more than 100';
    }
    if (parseAmount(taxPercent) > 100) next.tax = 'Tax cannot be more than 100%';
    return next;
  };

  const save = async () => {
    const found = validate();
    setErrors(found);
    const first = Object.values(found)[0];
    if (first) {
      showKollabToast(first);
      return;
    }
    const body: InvoiceInput = {
      brandName: brandName.trim(),
      contactName: contactName.trim(),
      brandEmail: brandEmail.trim(),
      billingAddress: billingAddress.trim(),
      brandGstin: brandGstin.trim(),
      fromName: fromName.trim(),
      fromEmail: fromEmail.trim(),
      fromAddress: fromAddress.trim(),
      fromGstin: fromGstin.trim(),
      issueDate,
      dueDate,
      currency,
      items: items
        .filter((r) => r.description.trim())
        .map((r) => ({
          description: r.description.trim(),
          quantity: parseAmount(r.quantity),
          unitPrice: parseAmount(r.unitPrice),
        })),
      discountType,
      discountValue: discountType === 'none' ? 0 : parseAmount(discountValue),
      taxLabel: taxLabel.trim() || 'GST',
      taxPercent: parseAmount(taxPercent),
      notes: notes.trim(),
      paymentDetails: paymentDetails.trim(),
    };
    setSaving(true);
    try {
      const res =
        mode === 'edit' && invoiceId
          ? await invoicesApi.update(invoiceId, body)
          : await invoicesApi.create(body);
      showKollabToast(mode === 'edit' ? 'Invoice updated' : 'Draft saved');
      onSaved(res.invoice);
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not save the invoice');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />;
  }

  const dateSheetValue: ScheduleDateTimeValue = dateToScheduleValue(isoToLocalDate(dueDate));

  return (
    <View style={styles.root}>
      {numberLabel ? (
        <Text style={[styles.number, { color: c.ink }]}>
          {mode === 'edit' ? 'Editing' : 'New invoice'} · {numberLabel}
        </Text>
      ) : null}

      <Section title="Bill to" subtitle="Customer billing details" glyph="doc">
        <Field label="Brand name" error={errors.brandName}>
          <KollabTextField
            surface="well"
            value={brandName}
            onChangeText={setBrandName}
            placeholder="e.g. Nike India"
            maxLength={200}
          />
        </Field>
        <View style={styles.twoCol}>
          <Field label="Contact person" style={styles.col}>
            <KollabTextField
              surface="well"
              value={contactName}
              onChangeText={setContactName}
              placeholder="Optional"
              maxLength={200}
            />
          </Field>
          <Field label="Email address" error={errors.brandEmail} style={styles.col}>
            <KollabTextField
              surface="well"
              value={brandEmail}
              onChangeText={setBrandEmail}
              placeholder="client@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={255}
            />
          </Field>
        </View>
        <Field label="Billing address">
          <KollabTextField
            surface="well"
            value={billingAddress}
            onChangeText={setBillingAddress}
            placeholder="Enter full address"
            multiline
            maxLength={1000}
          />
        </Field>
        <Field label="Brand GSTIN (optional)">
          <KollabTextField
            surface="well"
            value={brandGstin}
            onChangeText={(v) => setBrandGstin(v.toUpperCase())}
            placeholder="e.g. 29ABCDE1234F1Z5"
            autoCapitalize="characters"
            maxLength={20}
          />
        </Field>
        <Field label="Due date" error={errors.dueDate}>
          <Pressable
            onPress={() => setDateSheetOpen(true)}
            style={[styles.dateField, { backgroundColor: c.well, borderColor: c.outline }]}
            accessibilityRole="button"
            accessibilityLabel={`Due date ${formatIsoDate(dueDate)}`}
          >
            <Text style={[styles.dateText, { color: c.ink }]}>{formatIsoDate(dueDate)}</Text>
            <Glyph name="cal" color={c.ink} size={18} />
          </Pressable>
          <View style={styles.chipRow}>
            {NET_TERMS.map((days) => {
              const target = addDaysIso(issueDate, days);
              const on = dueDate === target;
              return (
                <Chip key={days} label={`Net ${days}`} on={on} onPress={() => setDueDate(target)} />
              );
            })}
          </View>
        </Field>
      </Section>

      <Section title="Deliverables" subtitle="Services being provided" glyph="store">
        {items.map((row, index) => {
          const amount = preview.amounts[index] ?? 0;
          return (
            <View key={row.key} style={[styles.itemCard, { borderColor: c.outline }]}>
              <KollabTextField
                surface="well"
                value={row.description}
                onChangeText={(v) => updateRow(row.key, { description: v })}
                placeholder="e.g. Instagram Reel"
                maxLength={500}
              />
              <View style={styles.itemNums}>
                <View style={styles.numCol}>
                  <Text style={[styles.tiny, { color: c.ink }]}>Qty</Text>
                  <KollabTextField
                    surface="well"
                    value={row.quantity}
                    onChangeText={(v) => updateRow(row.key, { quantity: v })}
                    keyboardType="decimal-pad"
                    placeholder="1"
                  />
                </View>
                <View style={styles.numCol}>
                  <Text style={[styles.tiny, { color: c.ink }]}>Rate</Text>
                  <KollabTextField
                    surface="well"
                    value={row.unitPrice}
                    onChangeText={(v) => updateRow(row.key, { unitPrice: v })}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                </View>
                <View style={styles.amountCol}>
                  <Text style={[styles.tiny, { color: c.ink }]}>Amount</Text>
                  <Text style={[styles.amount, { color: c.ink }]} numberOfLines={1}>
                    {formatInvoiceMoney(amount, currency)}
                  </Text>
                </View>
              </View>
              {items.length > 1 ? (
                <Pressable
                  onPress={() => setItems((rows) => rows.filter((r) => r.key !== row.key))}
                  accessibilityRole="button"
                  accessibilityLabel="Remove deliverable"
                  hitSlop={8}
                >
                  <Text style={[styles.remove, { color: c.heat }]}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
        {errors.items ? (
          <Text style={[styles.error, { color: c.heat }]}>{errors.items}</Text>
        ) : null}
        <Pressable
          onPress={() => setItems((rows) => (rows.length >= 50 ? rows : [...rows, newRow()]))}
          style={[styles.addBtn, { borderColor: c.outline, backgroundColor: c.card }]}
          accessibilityRole="button"
          accessibilityLabel="Add deliverable"
        >
          <Glyph name="plus" color={c.violetDeep} size={16} />
          <Text style={[styles.addText, { color: c.violetDeep }]}>Add deliverable</Text>
        </Pressable>
      </Section>

      <Section title="Discount & tax" subtitle="Applied to the subtotal" glyph="tag">
        <KollabSegmented
          segments={DISCOUNT_SEGMENTS}
          value={discountType}
          onChange={(k) => setDiscountType(k as InvoiceDiscountType)}
        />
        {discountType !== 'none' ? (
          <Field
            label={discountType === 'percent' ? 'Discount (%)' : 'Discount amount'}
            error={errors.discount}
          >
            <KollabTextField
              surface="well"
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </Field>
        ) : null}
        <View style={styles.twoCol}>
          <Field label="Tax name" style={styles.col}>
            <KollabTextField
              surface="well"
              value={taxLabel}
              onChangeText={setTaxLabel}
              placeholder="GST"
              maxLength={24}
            />
          </Field>
          <Field label="Tax (%)" error={errors.tax} style={styles.col}>
            <KollabTextField
              surface="well"
              value={taxPercent}
              onChangeText={setTaxPercent}
              keyboardType="decimal-pad"
              placeholder="0"
            />
          </Field>
        </View>
        <View style={styles.chipRow}>
          {TAX_PRESETS.map((p) => (
            <Chip
              key={p}
              label={p === 0 ? 'No tax' : `${p}%`}
              on={parseAmount(taxPercent) === p && (p !== 0 || taxPercent.trim() !== '')}
              onPress={() => setTaxPercent(String(p))}
            />
          ))}
        </View>
      </Section>

      <Section title="Payment & notes" subtitle="Shown on the invoice" glyph="wallet">
        <Field label="Payment details">
          <KollabTextField
            surface="well"
            value={paymentDetails}
            onChangeText={setPaymentDetails}
            placeholder="UPI ID or bank account details"
            multiline
            maxLength={1000}
          />
        </Field>
        <Field label="Notes">
          <KollabTextField
            surface="well"
            value={notes}
            onChangeText={setNotes}
            placeholder="Thank-you note, terms, usage rights…"
            multiline
            maxLength={2000}
          />
        </Field>
      </Section>

      <Pressable
        onPress={() => setShowFrom((v) => !v)}
        style={[styles.fromToggle, { backgroundColor: c.card }, kollab.shadow.card]}
        accessibilityRole="button"
        accessibilityState={{ expanded: showFrom }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: c.ink }]}>Your details</Text>
          <Text style={[styles.sectionSub, { color: c.ink }]} numberOfLines={1}>
            {fromName || fromEmail || 'Name, address and GSTIN on the invoice'}
          </Text>
        </View>
        <Text style={[styles.caret, { color: c.ink }]}>{showFrom ? '⌃' : '⌄'}</Text>
      </Pressable>
      {showFrom ? (
        <View style={[styles.fromBody, { backgroundColor: c.card }, kollab.shadow.card]}>
          <Field label="Name">
            <KollabTextField
              surface="well"
              value={fromName}
              onChangeText={setFromName}
              maxLength={200}
            />
          </Field>
          <Field label="Email" error={errors.fromEmail}>
            <KollabTextField
              surface="well"
              value={fromEmail}
              onChangeText={setFromEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={255}
            />
          </Field>
          <Field label="Address">
            <KollabTextField
              surface="well"
              value={fromAddress}
              onChangeText={setFromAddress}
              multiline
              maxLength={1000}
            />
          </Field>
          <Field label="GSTIN (optional)">
            <KollabTextField
              surface="well"
              value={fromGstin}
              onChangeText={(v) => setFromGstin(v.toUpperCase())}
              autoCapitalize="characters"
              maxLength={20}
            />
          </Field>
        </View>
      ) : null}

      <View style={[styles.totals, { backgroundColor: c.panel }]}>
        <TotalRow label="Subtotal" value={formatInvoiceMoney(preview.subtotal, currency)} />
        {preview.discountAmount > 0 ? (
          <TotalRow
            label="Discount"
            value={`− ${formatInvoiceMoney(preview.discountAmount, currency)}`}
          />
        ) : null}
        {parseAmount(taxPercent) > 0 ? (
          <TotalRow
            label={`${taxLabel.trim() || 'Tax'} (${parseAmount(taxPercent)}%)`}
            value={formatInvoiceMoney(preview.taxAmount, currency)}
          />
        ) : null}
        <View style={[styles.totalDivider, { backgroundColor: c.panelInk }]} />
        <TotalRow label="Total" value={formatInvoiceMoney(preview.total, currency)} big />
      </View>

      <KollabButton
        label={mode === 'edit' ? 'Save changes' : 'Save draft'}
        variant="ink"
        onPress={() => void save()}
        loading={saving}
        style={styles.save}
      />
      <Text style={[styles.hint, { color: c.ink }]}>
        You can email the invoice to the brand from the next screen.
      </Text>

      <ScheduleDateTimeSheet
        visible={dateSheetOpen}
        value={dateSheetValue}
        onClose={() => setDateSheetOpen(false)}
        onConfirm={(v) => {
          setDueDate(toIsoDate(v.date));
          setDateSheetOpen(false);
        }}
      />
    </View>
  );
}

function TotalRow({ label, value, big }: { label: string; value: string; big?: boolean }) {
  const kollab = useKollab();
  const ink = kollab.color.panelInk;
  return (
    <View style={styles.totalRow}>
      <Text style={[big ? styles.totalBigLabel : styles.totalLabel, { color: ink }]}>{label}</Text>
      <Text style={[big ? styles.totalBigValue : styles.totalValue, { color: ink }]}>{value}</Text>
    </View>
  );
}

function Section({
  title,
  subtitle,
  glyph,
  children,
}: {
  title: string;
  subtitle: string;
  glyph: React.ComponentProps<typeof Glyph>['name'];
  children: React.ReactNode;
}) {
  const kollab = useKollab();
  const c = kollab.color;
  return (
    <View style={[styles.section, { backgroundColor: c.card }, kollab.shadow.card]}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionIcon, { backgroundColor: c.well }]}>
          <Glyph name={glyph} color={c.violetDeep} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: c.ink }]}>{title}</Text>
          <Text style={[styles.sectionSub, { color: c.ink }]}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({
  label,
  error,
  style,
  children,
}: {
  label: string;
  error?: string;
  style?: object;
  children: React.ReactNode;
}) {
  const kollab = useKollab();
  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.label, { color: kollab.color.ink }]}>{label}</Text>
      {children}
      {error ? <Text style={[styles.error, { color: kollab.color.heat }]}>{error}</Text> : null}
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const kollab = useKollab();
  const spec = kollab.choiceChip;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: on ? spec.selectedBg : spec.idleBg,
          borderColor: on ? spec.selectedBorder : spec.idleBorder,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
    >
      <Text style={[styles.chipText, { color: on ? spec.selectedFg : spec.idleFg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  number: { fontFamily: font.semiBold, fontSize: 13, opacity: 0.6 },
  section: { borderRadius: 24, padding: 16, gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontFamily: font.bold, fontSize: 16 },
  sectionSub: { fontFamily: font.body, fontSize: 12.5, opacity: 0.55, marginTop: 1 },
  sectionBody: { gap: 12 },
  field: { gap: 6 },
  label: { fontFamily: font.semiBold, fontSize: 12.5, opacity: 0.7, marginLeft: 4 },
  error: { fontFamily: font.medium, fontSize: 12, marginLeft: 4 },
  twoCol: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  dateText: { fontFamily: font.medium, fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontFamily: font.semiBold, fontSize: 12.5 },
  itemCard: { borderWidth: 1.5, borderRadius: 18, padding: 10, gap: 8 },
  itemNums: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  numCol: { flex: 1, gap: 4 },
  amountCol: { flex: 1.1, gap: 4, paddingBottom: 14, alignItems: 'flex-end' },
  tiny: { fontFamily: font.medium, fontSize: 11, opacity: 0.55, marginLeft: 4 },
  amount: { fontFamily: font.bold, fontSize: 15 },
  remove: { fontFamily: font.semiBold, fontSize: 12.5, alignSelf: 'flex-end', marginRight: 6 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 13,
  },
  addText: { fontFamily: font.bold, fontSize: 14 },
  fromToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  caret: { fontFamily: font.bold, fontSize: 18 },
  fromBody: { borderRadius: 20, padding: 14, gap: 12, marginTop: -6 },
  totals: { borderRadius: 24, padding: 18, gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontFamily: font.medium, fontSize: 13.5, opacity: 0.75 },
  totalValue: { fontFamily: font.semiBold, fontSize: 14 },
  totalDivider: { height: StyleSheet.hairlineWidth, opacity: 0.4, marginVertical: 2 },
  totalBigLabel: { fontFamily: font.bold, fontSize: 16 },
  totalBigValue: { fontFamily: font.display, fontSize: 26 },
  save: { marginTop: 4 },
  hint: { fontFamily: font.body, fontSize: 12.5, opacity: 0.5, textAlign: 'center' },
});
