/**
 * Cloudinary delivery URLs. Campaign images are uploaded by brands at full size; phones should never download those for a card.
 * Inserting a transformation (automatic format and quality, capped width) typically shrinks them by 5 to 20 times and is served
 * from Cloudinary's CDN. Anything that is not a plain Cloudinary image URL is returned untouched.
 */

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;
// A transformation segment looks like "w_800,c_fill" or "f_auto"; a version is "v1700000000" and a folder is plain text.
const TRANSFORMATION_SEGMENT = /^[a-z]{1,3}_[^/,]+(,[a-z]{1,3}_[^/,]+)*$/;

export function optimizeCloudinaryUrl(url: string, width = 900): string {
  const match = CLOUDINARY_UPLOAD.exec(url);
  if (!match) return url;
  const [, base, rest] = match;
  const firstSegment = rest.split('/')[0];
  if (TRANSFORMATION_SEGMENT.test(firstSegment)) return url; // already transformed by whoever stored it
  const w = Math.max(100, Math.min(2000, Math.round(width)));
  return `${base}f_auto,q_auto,w_${w},c_limit/${rest}`;
}

/** The untransformed URL behind an optimized one, used to retry once if the CDN transformation itself fails to load. */
export function originalCloudinaryUrl(url: string): string {
  const m = CLOUDINARY_UPLOAD.exec(url);
  if (!m) return url;
  const [, base, rest] = m;
  const segments = rest.split('/');
  return TRANSFORMATION_SEGMENT.test(segments[0]) ? `${base}${segments.slice(1).join('/')}` : url;
}

/** Only https image URLs are shown: a campaign row is brand-supplied data, so anything else is treated as "no image". */
export function usableImageUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const url = raw.trim();
  return /^https:\/\/[^\s]+$/i.test(url) ? url : null;
}
