import type { MeetBookingStatus, MeetWindow } from './meets-api';

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const DURATION_PRESETS = [15, 30, 60];
export const MAX_RANGES_PER_DAY = 4;
export const MIN_DURATION = 15;
export const MAX_DURATION = 240;

/** Minutes from midnight as "09:00 AM". 1440 reads "12:00 AM" (end of the day). */
export function minuteLabel(minute: number): string {
  const m = ((minute % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  return `${String(h % 12 === 0 ? 12 : h % 12).padStart(2, '0')}:${mm} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** Every half hour of the day, used by the start / end pickers. */
export const TIME_OPTIONS: { value: string; label: string }[] = Array.from(
  { length: 49 },
  (_, i) => {
    const minute = i * 30;
    return { value: String(minute), label: minuteLabel(minute) };
  }
);

/** Monday to Friday, 9 to 5: the starting point shown in the screenshots. */
export function defaultWindows(): MeetWindow[] {
  return [1, 2, 3, 4, 5].map((weekday) => ({ weekday, startMinute: 540, endMinute: 1020 }));
}

export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
}

/** The first problem with a set of windows (same rules as the server), or null. */
export function windowsProblem(windows: MeetWindow[], durationMinutes: number): string | null {
  if (windows.length === 0) return 'Switch on at least one day';
  for (const w of windows) {
    if (w.endMinute <= w.startMinute)
      return `${WEEKDAY_NAMES[w.weekday]}: the end time must be after the start time`;
  }
  for (let day = 0; day < 7; day++) {
    const today = windows
      .filter((w) => w.weekday === day)
      .sort((a, b) => a.startMinute - b.startMinute);
    for (let i = 1; i < today.length; i++) {
      if (today[i].startMinute < today[i - 1].endMinute)
        return `${WEEKDAY_NAMES[day]}: time ranges cannot overlap`;
    }
  }
  if (!windows.some((w) => w.endMinute - w.startMinute >= durationMinutes))
    return 'Make at least one time range as long as the session';
  return null;
}

export function durationProblem(minutes: number): string | null {
  if (!Number.isInteger(minutes) || minutes < MIN_DURATION || minutes > MAX_DURATION)
    return `Duration must be ${MIN_DURATION} to ${MAX_DURATION} minutes`;
  if (minutes % 5 !== 0) return 'Duration must be a multiple of 5 minutes';
  return null;
}

/** The first problem with the two prices (same rules as the server), or null. */
export function priceProblem(mrp: number, price: number): string | null {
  if (!Number.isFinite(mrp) || !Number.isFinite(price)) return 'Enter valid prices';
  if (mrp < 0 || price < 0) return 'Prices cannot be negative';
  if (price > 0 && price < 1) return 'A paid meet must cost at least Rs.1';
  if (price > mrp) return 'The selling price cannot be higher than the original price';
  return null;
}

/** "20% off" or null when there is no discount. */
export function discountLabel(mrp: number, price: number): string | null {
  if (!(mrp > price) || mrp <= 0) return null;
  const pct = Math.round(((mrp - price) / mrp) * 100);
  return pct > 0 ? `${pct}% off` : null;
}

export function parseMoney(raw: string): number {
  const n = Number(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export const BOOKING_STATUS_UI: Record<
  MeetBookingStatus,
  { label: string; tone: 'neutral' | 'info' | 'live' | 'money' | 'warn' }
> = {
  pending: { label: 'Awaiting payment', tone: 'warn' },
  confirmed: { label: 'Confirmed', tone: 'live' },
  completed: { label: 'Completed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'warn' },
  failed: { label: 'Failed', tone: 'warn' },
  refund_due: { label: 'Refund due', tone: 'warn' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function clock(d: Date): string {
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** "Sat, 12 Nov · 6:00 PM – 6:30 PM" in the phone's own time zone. */
export function formatSessionRange(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return '';
  return `${DAYS[s.getDay()]}, ${s.getDate()} ${MONTHS[s.getMonth()]} · ${clock(s)} – ${clock(e)}`;
}

/** "Mon–Fri 09:00 AM – 05:00 PM" style one-liner for a list card. */
export function summarizeWindows(windows: MeetWindow[]): string {
  if (windows.length === 0) return 'No availability set';
  const days = Array.from(new Set(windows.map((w) => w.weekday))).sort((a, b) => a - b);
  const names = days.map((d) => DAYS[d]);
  const contiguous = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  const label =
    contiguous && days.length > 2 ? `${names[0]}–${names[names.length - 1]}` : names.join(', ');
  const first = windows
    .slice()
    .sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute)[0];
  return `${label} · ${minuteLabel(first.startMinute)} – ${minuteLabel(first.endMinute)}`;
}
