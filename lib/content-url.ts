/**
 * Same rules as the API's server/utils/content-url.ts: one post, one identity, whatever tracking noise the share link
 * carries (?igsh=, ?utm_, ?psln=), www./m. prefixes, or a trailing slash. Only YouTube's `v` identifies a post.
 */
export function canonicalContentUrl(raw: string): string {
  const text = String(raw ?? '').trim();
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
    const host = u.hostname.toLowerCase().replace(/^(www|m|mobile)\./, '');
    const path = u.pathname.replace(/\/+$/, '');
    const v = host.endsWith('youtube.com') ? u.searchParams.get('v') : null;
    return `${host}${path}${v ? `?v=${v}` : ''}`;
  } catch {
    return text.toLowerCase();
  }
}

/** "10 Nov 2026, 1:52 PM": always day-month-year and a 12-hour clock with AM/PM, whatever the phone's locale is. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function formatDateTime(input: string | number | Date | null | undefined): string {
  if (input === null || input === undefined || input === '') return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hour12}:${minutes} ${suffix}`;
}

/** "Analyzed 2h ago" (label is configurable). Falls back to the full date once it is older than a week. */
export function formatUpdatedAgo(input: string | number | Date | null | undefined, label = 'Updated'): string {
  if (input === null || input === undefined || input === '') return '';
  const t = new Date(input).getTime();
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return `${label} just now`;
  if (mins < 60) return `${label} ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${label} ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${label} ${days}d ago`;
  return `${label} ${formatDateTime(t)}`;
}
