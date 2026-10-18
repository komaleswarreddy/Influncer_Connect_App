/**
 * Live invoice preview maths for the create / edit form. Dependency-free on purpose.
 *
 * This is ONLY a preview: the server recomputes and stores every amount (server/services/invoice-calc.ts). The two
 * implementations are kept identical by server/services/invoice-math.parity.test.ts, which runs both on the same inputs.
 */
import type { InvoiceDiscountType } from './invoices-api';

export interface PreviewItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoicePreviewTotals {
  amounts: number[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

const toCents = (n: number): number => Math.round((n + Number.EPSILON) * 100);
const fromCents = (c: number): number => c / 100;

export function computeInvoicePreview(input: {
  items: PreviewItemInput[];
  discountType: InvoiceDiscountType;
  discountValue: number;
  taxPercent: number;
}): InvoicePreviewTotals {
  const amountCents = input.items.map((item) =>
    Math.round(item.quantity * toCents(item.unitPrice))
  );
  const subtotalCents = amountCents.reduce((sum, c) => sum + c, 0);

  let discountCents = 0;
  if (input.discountType === 'percent') {
    const pct = Math.min(Math.max(input.discountValue, 0), 100);
    discountCents = Math.round((subtotalCents * pct) / 100);
  } else if (input.discountType === 'flat') {
    discountCents = Math.min(Math.max(toCents(input.discountValue), 0), subtotalCents);
  }

  const taxableCents = subtotalCents - discountCents;
  const taxPct = Math.min(Math.max(input.taxPercent, 0), 100);
  const taxCents = Math.round((taxableCents * taxPct) / 100);

  return {
    amounts: amountCents.map(fromCents),
    subtotal: fromCents(subtotalCents),
    discountAmount: fromCents(discountCents),
    taxAmount: fromCents(taxCents),
    total: fromCents(taxableCents + taxCents),
  };
}

/** Forgiving numeric input: "1,500", " 12.5 " and "" all parse; anything else is 0. */
export function parseAmount(text: string): number {
  const n = Number(
    String(text ?? '')
      .replace(/,/g, '')
      .trim()
  );
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parses `YYYY-MM-DD` as a LOCAL date (never via Date.parse, which would read it as UTC and can shift the day). */
export function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDaysIso(iso: string, days: number): string {
  const d = isoToLocalDate(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** ₹ for INR (Indian grouping, paise only when present); other currencies print their ISO code. */
export function formatInvoiceMoney(amount: number, currency: string): string {
  const hasFraction = Math.round(amount * 100) % 100 !== 0;
  const digits = hasFraction ? 2 : 0;
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
  }
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}
