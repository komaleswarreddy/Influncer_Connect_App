import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  catalogProductCount,
  isCatalogSetupComplete,
  type InfluencerCatalog,
} from '@/lib/catalog-api';

const RATE_CALC_VISITED_KEY = 'home_quick_setup_rate_calculator_visited';
const TRENDING_VISITED_KEY = 'home_quick_setup_trending_visited';

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

/** Soft-done: opened Rate Calculator from Home Quick Setup at least once. */
export async function isRateCalculatorVisited(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(RATE_CALC_VISITED_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markRateCalculatorVisited(): Promise<void> {
  try {
    await AsyncStorage.setItem(RATE_CALC_VISITED_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Soft-done: opened Trending Ideas from Home Quick Setup at least once. */
export async function isTrendingIdeasVisited(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(TRENDING_VISITED_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markTrendingIdeasVisited(): Promise<void> {
  try {
    await AsyncStorage.setItem(TRENDING_VISITED_KEY, '1');
  } catch {
    /* ignore */
  }
}
