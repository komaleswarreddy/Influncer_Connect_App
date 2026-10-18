import type { LeadStage } from './leads-api';

export const LEAD_STAGE_UI: Record<
  LeadStage,
  { label: string; tone: 'info' | 'neutral' | 'money' | 'warn' | 'live' }
> = {
  new: { label: 'New', tone: 'info' },
  contacted: { label: 'Contacted', tone: 'live' },
  won: { label: 'Won', tone: 'money' },
  lost: { label: 'Lost', tone: 'neutral' },
};

/** "just now", "5m ago", "3h ago", "2d ago", then a short date. `now` is injectable for tests. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';
  const seconds = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const sameYear = then.getFullYear() === now.getFullYear();
  return `${then.getDate()} ${months[then.getMonth()]}${sameYear ? '' : ` ${then.getFullYear()}`}`;
}

/**
 * wa.me link for a phone number, or null when it can not be one. Digits only; a bare 10-digit number is assumed to be Indian
 * (this app is built for Indian creators), anything longer is taken as already carrying its country code.
 */
export function whatsappLink(phone: string | null | undefined): string | null {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}`;
}

/** tel: URI keeping only a leading + and digits. */
export function telLink(phone: string | null | undefined): string | null {
  const cleaned = String(phone ?? '')
    .replace(/[^\d+]/g, '')
    .replace(/(?!^)\+/g, '');
  return cleaned.replace(/\D/g, '').length >= 5 ? `tel:${cleaned}` : null;
}

export function mailtoLink(email: string | null | undefined, subject?: string): string | null {
  const e = String(email ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return `mailto:${e}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
}
