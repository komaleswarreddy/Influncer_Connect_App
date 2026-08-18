import { nicheCover, nicheCoverShape } from '@/theme/kollab-tokens';

export type NicheCoverKey = keyof typeof nicheCover;

/** Real campaigns carry ~20 freeform niche values (see CampaignFilters.tsx's NICHE_OPTIONS);
 *  Kollab's cover-image set only has 8. Bucket the rest onto the closest existing cover,
 *  defaulting anything unmatched to 'lifestyle'. */
const NICHE_OVERRIDES: Record<string, NicheCoverKey> = {
  health: 'fitness',
  gaming: 'technology',
  education: 'lifestyle',
  business: 'lifestyle',
  finance: 'lifestyle',
};

export function resolveNicheCoverKey(niche: string | null | undefined): NicheCoverKey {
  const key = (niche ?? '').trim().toLowerCase();
  if (key in nicheCover) return key as NicheCoverKey;
  if (key in NICHE_OVERRIDES) return NICHE_OVERRIDES[key];
  return 'lifestyle';
}

export function nicheCoverSource(niche: string | null | undefined) {
  return nicheCover[resolveNicheCoverKey(niche)];
}

export function nicheCoverCardShape(niche: string | null | undefined) {
  return nicheCoverShape[resolveNicheCoverKey(niche)];
}
