import type { EventDisplayStatus } from './events-api';

export const EVENT_STATUS_UI: Record<
  EventDisplayStatus,
  { label: string; tone: 'neutral' | 'info' | 'live' | 'money' | 'warn' }
> = {
  draft: { label: 'Draft', tone: 'neutral' },
  upcoming: { label: 'Upcoming', tone: 'info' },
  live: { label: 'Live now', tone: 'live' },
  ended: { label: 'Ended', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'warn' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function clock(d: Date): string {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** "Sat, 12 Nov · 6:00 PM – 8:00 PM" (device time zone). Multi-day events show both dates. */
export function formatEventRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '';
  const day = (d: Date) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const sameDay = s.toDateString() === e.toDateString();
  return sameDay
    ? `${day(s)} · ${clock(s)} – ${clock(e)}`
    : `${day(s)} ${clock(s)} – ${day(e)} ${clock(e)}`;
}

/** Combines a calendar date with an hour and minute into one local Date. */
export function combineDateTime(date: Date, hour24: number, minute: number): Date {
  const d = new Date(date);
  d.setHours(hour24, minute, 0, 0);
  return d;
}

/** A sensible default for a brand-new event: tomorrow 6 PM to 8 PM. */
export function defaultEventWindow(now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(18, 0, 0, 0);
  const end = new Date(start);
  end.setHours(20, 0, 0, 0);
  return { start, end };
}

export const CHECK_IN_UI: Record<string, { label: string; tone: 'ok' | 'warn' | 'bad' }> = {
  checked_in: { label: 'Checked in', tone: 'ok' },
  already_checked_in: { label: 'Already checked in', tone: 'warn' },
  cancelled: { label: 'Ticket cancelled', tone: 'bad' },
  wrong_event: { label: 'Not for this event', tone: 'bad' },
  not_found: { label: 'Ticket not found', tone: 'bad' },
};
