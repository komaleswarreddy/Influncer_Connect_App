import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Platform,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useKollab, font, space, radius as kollabRadius } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';

export type SwipeFeedRenderOptions = {
  variant: 'active' | 'peek';
  /** Always false for compact cards — kept for call-site compatibility. */
  fillHeight: boolean;
};

/**
 * Visible strip of the next card under the active page.
 * Shared by Exclusive / Public / Mine.
 */
export const CAMPAIGN_FEED_PEEK_PX = 64;

/** Fallback page height before the first card measures (compact, not full screen). */
const FALLBACK_CARD_PAGE_PX = 320;
const SLOT_PAD_TOP = 4;

type Props<T> = {
  data: T[];
  /** Max vertical space under chrome (feed shell). Viewport will be card + peek, capped by this. */
  itemHeight: number;
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number, options?: SwipeFeedRenderOptions) => React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  peekPx?: number;
};

/** Session-scoped: hint shows once until app restart (all three tabs share it). */
let swipeUpHintShownThisSession = false;

function SwipeFeedSlot({
  index,
  pageHeight,
  scrollY,
  nudgeY,
  children,
}: {
  index: number;
  pageHeight: number;
  scrollY: SharedValue<number>;
  nudgeY: SharedValue<number>;
  children: React.ReactNode;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    if (pageHeight <= 0) return {};
    const pageTop = index * pageHeight;
    const scale = interpolate(
      scrollY.value,
      [pageTop - pageHeight, pageTop, pageTop + pageHeight],
      [0.97, 1, 0.94],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      [
        pageTop - pageHeight,
        pageTop - pageHeight * 0.4,
        pageTop,
        pageTop + pageHeight * 0.5,
        pageTop + pageHeight,
      ],
      [0.65, 0.9, 1, 0.8, 0.58],
      Extrapolation.CLAMP
    );
    const translateY =
      interpolate(
        scrollY.value,
        [pageTop - pageHeight, pageTop, pageTop + pageHeight],
        [8, 0, -5],
        Extrapolation.CLAMP
      ) + (index === 0 ? nudgeY.value : 0);
    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  return <Animated.View style={[styles.activeAnimated, animatedStyle]}>{children}</Animated.View>;
}

function SwipeGlassPill({ activeIndex, total }: { activeIndex: number; total: number }) {
  const kollab = useKollab();
  const kStyles = useKollabStyles(kollab);
  if (total <= 1) return null;

  const atStart = activeIndex <= 0;
  const atEnd = activeIndex >= total - 1;
  const pillBody = (
    <>
      <Ionicons
        name="chevron-up"
        size={14}
        color={atStart ? kollab.color.inkFaint : kollab.color.inkMuted}
      />
      <Text style={kStyles.pillCount}>
        {activeIndex + 1}
        <Text style={kStyles.pillCountMuted}> / {total}</Text>
      </Text>
      <Ionicons
        name="chevron-down"
        size={14}
        color={atEnd ? kollab.color.inkFaint : kollab.color.inkMuted}
      />
    </>
  );

  return (
    <View style={styles.pillWrap} pointerEvents="none">
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={48}
          tint={kollab.isDark ? 'dark' : 'light'}
          style={[styles.pill, kStyles.pill]}
        >
          {pillBody}
        </BlurView>
      ) : (
        <View style={[styles.pill, kStyles.pill, kStyles.pillAndroid]}>{pillBody}</View>
      )}
    </View>
  );
}

function SwipeUpHintOverlay({ visible }: { visible: boolean }) {
  const kollab = useKollab();
  const kStyles = useKollabStyles(kollab);
  const bounce = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      cancelAnimation(bounce);
      fade.value = withTiming(0, { duration: 220 });
      return;
    }
    fade.value = withTiming(1, { duration: 280 });
    bounce.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 480, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 480, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(bounce);
    };
  }, [visible, bounce, fade]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: bounce.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.hintWrap, wrapStyle]} pointerEvents="none">
      <View style={[styles.hintPill, kStyles.hintPill]}>
        <Ionicons name="chevron-up" size={16} color={kollab.color.ink} />
        <Text style={kStyles.hintText}>Swipe up for next</Text>
      </View>
    </Animated.View>
  );
}

/**
 * Vertical snap feed for Exclusive / Public / Mine.
 * Compact content-sized cards + tight viewport (card + peek). No header stretch.
 */
export function CampaignSwipeFeed<T>({
  data,
  itemHeight: availableHeight,
  keyExtractor,
  renderItem,
  refreshing = false,
  onRefresh,
  peekPx = CAMPAIGN_FEED_PEEK_PX,
}: Props<T>) {
  const kollab = useKollab();
  const scrollY = useSharedValue(0);
  const nudgeY = useSharedValue(0);
  const listRef = useRef<Animated.FlatList<T>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const hintDismissedRef = useRef(false);
  /** Natural card+slot height from onLayout (max across measured rows). */
  const [measuredPageH, setMeasuredPageH] = useState(0);
  const measuredRef = useRef(0);

  const pageHeight = useMemo(() => {
    if (availableHeight <= 0) return 0;
    const natural =
      measuredPageH > 0
        ? measuredPageH
        : Math.min(FALLBACK_CARD_PAGE_PX, Math.max(200, availableHeight - peekPx));
    if (data.length <= 1) {
      return Math.min(natural, availableHeight);
    }
    // Cap so card + peek still fits in the feed shell.
    const maxPage = Math.max(200, availableHeight - peekPx);
    return Math.min(natural, maxPage);
  }, [availableHeight, measuredPageH, peekPx, data.length]);

  const viewportHeight = useMemo(() => {
    if (pageHeight <= 0 || availableHeight <= 0) return 0;
    if (data.length <= 1) return Math.min(pageHeight, availableHeight);
    return Math.min(pageHeight + peekPx, availableHeight);
  }, [pageHeight, peekPx, availableHeight, data.length]);

  /** Push the card block down a bit so top/bottom whitespace looks balanced. */
  const topInset = useMemo(() => {
    if (availableHeight <= 0 || viewportHeight <= 0) return 0;
    const spare = availableHeight - viewportHeight;
    if (spare < 16) return 8;
    // ~38% of spare above the feed, rest below — avoids “stuck to chips” and empty bottom.
    return Math.max(12, Math.min(36, Math.round(spare * 0.38)));
  }, [availableHeight, viewportHeight]);

  const dismissHint = useCallback(() => {
    if (hintDismissedRef.current) return;
    hintDismissedRef.current = true;
    swipeUpHintShownThisSession = true;
    setShowHint(false);
    cancelAnimation(nudgeY);
    nudgeY.value = withTiming(0, { duration: 180 });
  }, [nudgeY]);

  useEffect(() => {
    measuredRef.current = 0;
    setMeasuredPageH(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    setActiveIndex(0);
    scrollY.value = 0;
  }, [data.length, scrollY]);

  useEffect(() => {
    if (pageHeight > 0 && data.length > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      setActiveIndex(0);
      scrollY.value = 0;
    }
  }, [pageHeight, data.length, scrollY]);

  useEffect(() => {
    if (
      pageHeight <= 0 ||
      data.length <= 1 ||
      swipeUpHintShownThisSession ||
      hintDismissedRef.current
    ) {
      return;
    }

    setShowHint(true);
    nudgeY.value = withDelay(
      350,
      withSequence(
        withTiming(-14, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 460, easing: Easing.inOut(Easing.quad) }),
        withTiming(-10, { duration: 360, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.quad) })
      )
    );

    const timeout = setTimeout(() => {
      dismissHint();
    }, 3000);

    return () => {
      clearTimeout(timeout);
      cancelAnimation(nudgeY);
    };
  }, [data.length, pageHeight, dismissHint, nudgeY]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      if (event.contentOffset.y > 10) {
        runOnJS(dismissHint)();
      }
    },
  });

  const snapToNearest = useCallback(
    (offsetY: number) => {
      if (pageHeight <= 0) return;
      const next = Math.round(offsetY / pageHeight);
      const clamped = Math.min(Math.max(next, 0), Math.max(data.length - 1, 0));
      setActiveIndex(clamped);
      listRef.current?.scrollToOffset({ offset: clamped * pageHeight, animated: true });
      if (clamped > 0) dismissHint();
    },
    [pageHeight, data.length, dismissHint]
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      snapToNearest(event.nativeEvent.contentOffset.y);
    },
    [snapToNearest]
  );

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const vy = event.nativeEvent.velocity?.y ?? 0;
      if (Math.abs(vy) < 0.15) {
        snapToNearest(event.nativeEvent.contentOffset.y);
      }
    },
    [snapToNearest]
  );

  const renderRow = useCallback(
    ({ item, index }: ListRenderItemInfo<T>) => {
      const variant: SwipeFeedRenderOptions['variant'] = index === activeIndex ? 'active' : 'peek';
      return (
        <View style={[styles.slot, { height: pageHeight }]}>
          <SwipeFeedSlot index={index} pageHeight={pageHeight} scrollY={scrollY} nudgeY={nudgeY}>
            <View
              style={styles.cardHost}
              onLayout={
                index < 3
                  ? (event) => {
                      const contentH = Math.ceil(event.nativeEvent.layout.height) + SLOT_PAD_TOP;
                      if (contentH < 120) return;
                      if (Math.abs(contentH - measuredRef.current) < 3 && measuredRef.current > 0) {
                        return;
                      }
                      const next = Math.max(measuredRef.current, contentH);
                      if (next === measuredRef.current) return;
                      measuredRef.current = next;
                      setMeasuredPageH(next);
                    }
                  : undefined
              }
            >
              {renderItem(item, index, { variant, fillHeight: false })}
            </View>
          </SwipeFeedSlot>
        </View>
      );
    },
    [pageHeight, renderItem, scrollY, nudgeY, activeIndex]
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<T> | null | undefined, index: number) => ({
      length: pageHeight,
      offset: pageHeight * index,
      index,
    }),
    [pageHeight]
  );

  if (availableHeight <= 0 || pageHeight <= 0 || viewportHeight <= 0) return null;

  return (
    <View style={[styles.outer, { maxHeight: availableHeight }]}>
      <View style={{ height: topInset }} />
      <View
        style={[styles.shell, { height: viewportHeight, maxHeight: availableHeight - topInset }]}
      >
        <Animated.FlatList
          ref={listRef}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderRow}
          pagingEnabled={false}
          snapToInterval={pageHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollEndDrag={onScrollEndDrag}
          getItemLayout={getItemLayout}
          style={styles.list}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={kollab.color.ink}
              />
            ) : undefined
          }
          contentContainerStyle={
            data.length === 0
              ? styles.emptyList
              : data.length > 1
                ? { paddingBottom: peekPx }
                : undefined
          }
        />
        <SwipeUpHintOverlay visible={showHint && data.length > 1} />
        <SwipeGlassPill activeIndex={activeIndex} total={data.length} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    alignSelf: 'stretch',
  },
  shell: {
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  list: {
    flex: 1,
  },
  slot: {
    paddingHorizontal: space.md,
    paddingTop: SLOT_PAD_TOP,
    paddingBottom: 0,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  activeAnimated: {
    width: '100%',
  },
  cardHost: {
    width: '100%',
  },
  emptyList: {
    flexGrow: 1,
  },
  hintWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: space.sm + 40,
    alignItems: 'center',
    zIndex: 3,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: kollabRadius.pill,
    borderWidth: 1,
  },
  hintText: {
    fontFamily: font.semiBold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  pillWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: space.sm,
    alignItems: 'center',
    zIndex: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: kollabRadius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillCount: {
    fontFamily: font.semiBold,
    fontSize: 12,
    lineHeight: 14,
    minWidth: 44,
    textAlign: 'center',
  },
  pillCountMuted: {
    fontFamily: font.body,
  },
});

/** Reactive (light/dark) color + shadow slice — layout/shape lives in the static `styles` above. */
function useKollabStyles(kollab: KollabTokens) {
  return useMemo(
    () =>
      StyleSheet.create({
        hintPill: {
          backgroundColor: kollab.color.card,
          borderColor: kollab.color.hairline,
          ...kollab.shadow.card,
        },
        hintText: {
          color: kollab.color.ink,
        },
        pill: {
          borderColor: kollab.color.hairline,
          ...kollab.shadow.card,
        },
        pillAndroid: {
          backgroundColor: kollab.color.card,
        },
        pillCount: {
          color: kollab.color.ink,
        },
        pillCountMuted: {
          color: kollab.color.inkFaint,
        },
      }),
    [kollab]
  );
}
