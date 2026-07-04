import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Matches PremiumTabBar content height (icons + labels + vertical padding). */
export const TAB_BAR_BODY_HEIGHT = 52;
export const TAB_BAR_EXTRA_PADDING = 12;

export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_BODY_HEIGHT + Math.max(insets.bottom, 8) + TAB_BAR_EXTRA_PADDING;
}

export function tabBarInsetWithSafeArea(bottomInset: number): number {
  return TAB_BAR_BODY_HEIGHT + Math.max(bottomInset, 8) + TAB_BAR_EXTRA_PADDING;
}
