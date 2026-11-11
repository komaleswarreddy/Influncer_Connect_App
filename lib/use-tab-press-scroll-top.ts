import { useCallback, useEffect, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { useNavigation } from 'expo-router';

type AnyNavigation = {
  getState?: () => { type?: string; index: number; routes: Array<{ key: string }> };
  getParent?: () => AnyNavigation | undefined;
  isFocused: () => boolean;
  addListener: (type: string, cb: (e: { target?: string }) => void) => () => void;
};

/** Nearest navigator above (or at) this screen that is the bottom-tab navigator. */
function findTabNavigator(start: AnyNavigation): AnyNavigation | null {
  let nav: AnyNavigation | undefined = start;
  while (nav) {
    if (nav.getState?.()?.type === 'tab') return nav;
    nav = nav.getParent?.();
  }
  return null;
}

/**
 * Tapping the tab you are already on: first tap scrolls to the top, a second tap while at the top refreshes.
 * Switching from another tab is untouched (it keeps its scroll position).
 *
 * The listener sits on the TAB navigator, not on the screen. A tab whose screen lives in a nested stack (Collabs) never
 * receives `tabPress` on the screen's own navigation, so listening there silently did nothing.
 *
 * Pass `scrollRef` to ScrollScreen's `scrollRef` and spread `scrollProps` into its `scrollProps`.
 */
export function useTabPressScrollTop(onRefresh?: () => void) {
  const navigation = useNavigation() as unknown as AnyNavigation;
  const scrollRef = useRef<ScrollView>(null);
  const offsetY = useRef(0);
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  useEffect(() => {
    const tabNav = findTabNavigator(navigation);
    if (!tabNav) return undefined;
    const unsubscribe = tabNav.addListener('tabPress', (e) => {
      const state = tabNav.getState?.();
      const focusedTabKey = state?.routes[state.index]?.key;
      // Only a repeat tap on the tab that is already showing, and only for the screen that is on top.
      if (!state || e.target !== focusedTabKey || !navigation.isFocused()) return;
      if (offsetY.current > 8) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else {
        refreshRef.current?.();
      }
    });
    return unsubscribe;
  }, [navigation]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetY.current = e.nativeEvent.contentOffset.y;
  }, []);

  return { scrollRef, scrollProps: { onScroll, scrollEventThrottle: 16 } };
}
