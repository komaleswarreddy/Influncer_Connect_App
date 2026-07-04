import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Platform,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { spacing, appShell, radius, shadow } from '@/theme';
import { fonts } from '@/components/ui/typography';

export type SwipeFeedRenderOptions = {
  variant: 'active' | 'peek';
};

type Props<T> = {
  data: T[];
  itemHeight: number;
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number, options?: SwipeFeedRenderOptions) => React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
};

function SwipeFeedSlot({
  index,
  itemHeight,
  scrollY,
  children,
}: {
  index: number;
  itemHeight: number;
  scrollY: SharedValue<number>;
  children: React.ReactNode;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    if (itemHeight <= 0) return {};
    const center = index * itemHeight;
    const scale = interpolate(
      scrollY.value,
      [center - itemHeight, center, center + itemHeight],
      [0.98, 1, 0.98],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      [center - itemHeight, center, center + itemHeight],
      [0.85, 1, 0.85],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ scale }] };
  });

  return <Animated.View style={[styles.activeAnimated, animatedStyle]}>{children}</Animated.View>;
}

function SwipeGlassPill({
  activeIndex,
  total,
}: {
  activeIndex: number;
  total: number;
}) {
  if (total <= 1) return null;

  const atStart = activeIndex <= 0;
  const atEnd = activeIndex >= total - 1;
  const pillBody = (
    <>
      <Ionicons
        name="chevron-up"
        size={14}
        color={atStart ? 'rgba(10, 17, 40, 0.22)' : appShell.textSecondary}
      />
      <Text style={styles.pillCount}>
        {activeIndex + 1}
        <Text style={styles.pillCountMuted}> / {total}</Text>
      </Text>
      <Ionicons
        name="chevron-down"
        size={14}
        color={atEnd ? 'rgba(10, 17, 40, 0.22)' : appShell.textSecondary}
      />
    </>
  );

  return (
    <View style={styles.pillWrap} pointerEvents="none">
      {Platform.OS === 'ios' ? (
        <BlurView intensity={48} tint="light" style={styles.pill}>
          {pillBody}
        </BlurView>
      ) : (
        <View style={[styles.pill, styles.pillAndroid]}>{pillBody}</View>
      )}
    </View>
  );
}

export function CampaignSwipeFeed<T>({
  data,
  itemHeight,
  keyExtractor,
  renderItem,
  refreshing = false,
  onRefresh,
}: Props<T>) {
  const scrollY = useSharedValue(0);
  const listRef = useRef<Animated.FlatList<T>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (itemHeight > 0 && data.length > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      setActiveIndex(0);
    }
  }, [data.length, itemHeight]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (itemHeight <= 0) return;
      const next = Math.round(event.nativeEvent.contentOffset.y / itemHeight);
      const clamped = Math.min(Math.max(next, 0), Math.max(data.length - 1, 0));
      setActiveIndex(clamped);
      if (clamped !== next) {
        listRef.current?.scrollToOffset({ offset: clamped * itemHeight, animated: true });
      }
    },
    [itemHeight, data.length]
  );

  const renderRow = useCallback(
    ({ item, index }: ListRenderItemInfo<T>) => (
      <View style={[styles.slot, { height: itemHeight }]}>
        <SwipeFeedSlot index={index} itemHeight={itemHeight} scrollY={scrollY}>
          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardScrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            bounces={false}
          >
            {renderItem(item, index, { variant: 'active' })}
          </ScrollView>
        </SwipeFeedSlot>
      </View>
    ),
    [itemHeight, renderItem, scrollY]
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<T> | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight]
  );

  if (itemHeight <= 0) return null;

  return (
    <View style={styles.shell}>
      <Animated.FlatList
        ref={listRef}
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        pagingEnabled
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={getItemLayout}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appShell.cta} />
          ) : undefined
        }
        contentContainerStyle={data.length === 0 ? styles.emptyList : undefined}
      />
      <SwipeGlassPill activeIndex={activeIndex} total={data.length} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  slot: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  activeAnimated: {
    width: '100%',
    flex: 1,
  },
  cardScroll: {
    flex: 1,
  },
  cardScrollContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  emptyList: {
    flexGrow: 1,
  },
  pillWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.sm,
    alignItems: 'center',
    zIndex: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20, 30, 51, 0.1)',
    ...shadow.cardLight,
  },
  pillAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  pillCount: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 14,
    color: appShell.textPrimary,
    minWidth: 44,
    textAlign: 'center',
  },
  pillCountMuted: {
    fontFamily: fonts.regular,
    color: appShell.textMuted,
  },
});
