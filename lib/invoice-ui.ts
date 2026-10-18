import type { InvoiceDisplayStatus } from './invoices-api';

export type InvoiceChipTone = 'live' | 'money' | 'info' | 'neutral' | 'warn';

/** Status pill copy + tone (tones are KollabStatusChip's). Overdue is the only warning state. */
export const INVOICE_STATUS_UI: Record<
  InvoiceDisplayStatus,
  { label: string; tone: InvoiceChipTone }
> = {
  draft: { label: 'Draft', tone: 'neutral' },
  sent: { label: 'Sent', tone: 'info' },
  overdue: { label: 'Overdue', tone: 'warn' },
  paid: { label: 'Paid', tone: 'money' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
};
