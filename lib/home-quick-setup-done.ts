import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  catalogProductCount,
  isCatalogSetupComplete,
  type InfluencerCatalog,
} from '@/lib/catalog-api';

const RATE_CALC_VISITED_KEY = 'home_quick_setup_rate_calculator_visited';
const TRENDING_VISITED_KEY = 'home_quick_setup_trending_visited';

/**
 * These flags are per-user, not per-device. The unscoped keys above shipped earlier and were
 * device-global — AsyncStorage survives logout (`clearEntireSession` only clears token/user/
 * authNextStep), so one account tapping Rate Calculator marked it done for every account that
 * later signed in on the same device. Scoping by user id fixes that leak; `purgeLegacyQuickSetupFlags`
 * removes the ambiguous old values, which we deliberately do not migrate since we cannot tell
 * which account set them.
 */
function scopedKey(baseKey: string, userId: string): string {
  return `${baseKey}:${userId}`;
}

async function readFlag(baseKey: string, userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  try {
    return (await AsyncStorage.getItem(scopedKey(baseKey, userId))) === '1';
  } catch {
    return false;
  }
}

async function writeFlag(baseKey: string, userId: string | null | undefined): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(scopedKey(baseKey, userId), '1');
  } catch {
    /* ignore */
  }
}

/** One-time cleanup of the pre-scoping device-global flags. Safe to call on every mount. */
export async function purgeLegacyQuickSetupFlags(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([RATE_CALC_VISITED_KEY, TRENDING_VISITED_KEY]);
  } catch {
    /* ignore */
  }
}

/** Pricing fields that indicate a saved Price Card (mirrors rate-card screen). */
const RATE_CARD_AMOUNT_KEYS = [
  'instagramReel',
  'instagramPost',
  'instagramStory',
  'youtubeIntegration',
  'youtubeDedicated',
  'tiktokVideo',
  'ugcVideo',
  'ugcPhoto',
  'appearanceFee',
  'consultationFee',
] as const;

/** Soft-done: at least one pricing field saved above zero. */
export function isPriceCardDone(rateCard: Record<string, unknown> | null | undefined): boolean {
  if (!rateCard || typeof rateCard !== 'object') return false;
  return RATE_CARD_AMOUNT_KEYS.some((key) => {
    const n = Number(rateCard[key]);
    return Number.isFinite(n) && n > 0;
  });
}

/** Soft-done: catalog has products or setup past default empty state. */
export function isCreateProductsDone(catalog: InfluencerCatalog | null): boolean {
  if (!catalog) return false;
  return catalogProductCount(catalog) >= 1 || isCatalogSetupComplete(catalog);
}

/** Soft-done: this user opened Rate Calculator from Home Quick Setup at least once. */
export function isRateCalculatorVisited(userId: string | null | undefined): Promise<boolean> {
  return readFlag(RATE_CALC_VISITED_KEY, userId);
}

export function markRateCalculatorVisited(userId: string | null | undefined): Promise<void> {
  return writeFlag(RATE_CALC_VISITED_KEY, userId);
}

/** Soft-done: this user opened Trending Ideas from Home Quick Setup at least once. */
export function isTrendingIdeasVisited(userId: string | null | undefined): Promise<boolean> {
  return readFlag(TRENDING_VISITED_KEY, userId);
}

export function markTrendingIdeasVisited(userId: string | null | undefined): Promise<void> {
  return writeFlag(TRENDING_VISITED_KEY, userId);
}
