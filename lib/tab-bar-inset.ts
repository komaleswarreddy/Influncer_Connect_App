import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nav } from '@/theme/kollab-tokens';

/** Matches KollabTabBar's shell height (88) plus how far the FAB pokes above the shell top (32). */
export const TAB_BAR_BODY_HEIGHT = nav.height + Math.abs(nav.fabOffsetY);
/** Lean buffer above the tab bar — avoid large empty scroll end. */
export const TAB_BAR_EXTRA_PADDING = 10;

export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_BODY_HEIGHT + nav.insetBottom + insets.bottom + TAB_BAR_EXTRA_PADDING;
}

export function tabBarInsetWithSafeArea(bottomInset: number): number {
  return TAB_BAR_BODY_HEIGHT + nav.insetBottom + bottomInset + TAB_BAR_EXTRA_PADDING;
}
