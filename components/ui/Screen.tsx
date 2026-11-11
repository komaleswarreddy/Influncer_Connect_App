import React from 'react';
import { View, StyleSheet, ScrollView, type ScrollViewProps, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useKollab, space } from '@/theme/kollab-tokens';
import { DotBackground } from './DotBackground';
import { useTabBarInset } from '@/lib/tab-bar-inset';

type ScreenProps = ViewProps & {
  children: React.ReactNode;
  /** Opt-in only — new Kollab screens leave this off. */
  dotBackground?: boolean;
  safeAreaEdges?: Edge[];
  /** Horizontal padding (default: 22 gutter). */
  padH?: number;
};

export function Screen({
  children,
  dotBackground = false,
  safeAreaEdges = ['top', 'left', 'right'],
  padH = space.gutter,
  style,
  ...rest
}: ScreenProps) {
  const kollab = useKollab();
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: kollab.color.screen }, style]}
      edges={safeAreaEdges}
      {...rest}
    >
      <View style={[styles.fill, { backgroundColor: kollab.color.screen }]}>
        {dotBackground ? <DotBackground dotColor={kollab.color.dot} /> : null}
        <View style={[styles.inner, { paddingHorizontal: padH }]}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

type ScrollScreenProps = Omit<ScreenProps, 'children'> & {
  children: React.ReactNode;
  scrollProps?: ScrollViewProps;
  /** Optional ref to the inner ScrollView (for scroll-to-top on tab press). */
  scrollRef?: React.Ref<ScrollView>;
  canvasColor?: string;
  contentInsetBottom?: boolean | number;
  footer?: React.ReactNode;
};

export function ScrollScreen({
  children,
  dotBackground = false,
  safeAreaEdges = ['top', 'left', 'right'],
  padH = space.gutter,
  scrollProps,
  scrollRef,
  style,
  canvasColor,
  contentInsetBottom = false,
  footer,
}: ScrollScreenProps) {
  const kollab = useKollab();
  const tabBarInset = useTabBarInset();
  const inset =
    contentInsetBottom === true
      ? tabBarInset
      : typeof contentInsetBottom === 'number'
        ? contentInsetBottom
        : 0;
  const bg = canvasColor ?? kollab.color.screen;
  const { contentContainerStyle: scrollContentStyle, ...restScrollProps } = scrollProps ?? {};
  const mergedContentStyle = [
    styles.scrollContent,
    { paddingHorizontal: padH, paddingBottom: space.xs + inset },
    scrollContentStyle,
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }, style]} edges={safeAreaEdges}>
      <View style={[styles.fill, { backgroundColor: bg }]}>
        {dotBackground ? <DotBackground dotColor={kollab.color.dot} /> : null}
        <ScrollView
          ref={scrollRef}
          style={[styles.scroll, { backgroundColor: bg }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces
          alwaysBounceVertical
          {...restScrollProps}
          contentContainerStyle={mergedContentStyle}
        >
          {children}
        </ScrollView>
        {footer ? (
          <View
            style={[
              styles.footer,
              { backgroundColor: bg, paddingHorizontal: padH, paddingBottom: space.xs },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  inner: {
    flex: 1,
    zIndex: 1,
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  footer: {
    paddingTop: space.xs,
  },
});
