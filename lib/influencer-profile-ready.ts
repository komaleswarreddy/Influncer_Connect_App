/** Matches server gate for GET /api/rate-cards/suggested (profile settings only). */
export type InfluencerProfileApi = {
  niche?: string;
  country?: string;
  profileCompleted?: boolean;
};

export const PROFILE_INCOMPLETE_HINT =
  'Complete your profile settings (niche, country, and save your profile) before requesting AI suggestions.';

export function isInfluencerProfileReadyForSuggestions(profile: InfluencerProfileApi | null): boolean {
  if (!profile) return false;
  if (!profile.profileCompleted) return false;
  const niche = String(profile.niche ?? '').trim();
  const country = String(profile.country ?? '').trim();
  return niche.length > 0 && country.length > 0;
}
