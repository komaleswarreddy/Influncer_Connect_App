import React from 'react';
import { View, StyleSheet, ScrollView, type ScrollViewProps, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { appShell, spacing } from '@/theme';
import { useAppShell } from '@/theme/useAppShell';
import { DotBackground } from './DotBackground';
import { useTabBarInset } from '@/lib/tab-bar-inset';

type ScreenProps = ViewProps & {
  children: React.ReactNode;
  /** Show dot-grid background */
  dotBackground?: boolean;
  safeAreaEdges?: Edge[];
  /** Horizontal padding (default: md — matches dense dashboard) */
  padH?: number;
};

/**
 * Premium shell: safe area + optional dot canvas + horizontal padding.
 */
export function Screen({
  children,
  dotBackground = true,
  safeAreaEdges = ['top', 'left', 'right'],
  padH = spacing.md,
  style,
  ...rest
}: ScreenProps) {
  const shell = useAppShell();
  const showDots = dotBackground && shell.showDotBackground;
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: shell.canvas }, style]}
      edges={safeAreaEdges}
      {...rest}
    >
      <View style={[styles.fill, { backgroundColor: shell.canvas }]}>
        {showDots ? <DotBackground /> : null}
        <View style={[styles.inner, { paddingHorizontal: padH }]}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

type ScrollScreenProps = Omit<ScreenProps, 'children'> & {
  children: React.ReactNode;
  scrollProps?: ScrollViewProps;
  /** Override default canvas color (e.g. home screen #F3F4F6) */
  canvasColor?: string;
  /** Extra bottom padding for tab bar overlap (true = auto from hook, number = explicit px) */
  contentInsetBottom?: boolean | number;
};

export function ScrollScreen({
  children,
  dotBackground = true,
  safeAreaEdges = ['top', 'left', 'right'],
  padH = spacing.lg,
  scrollProps,
  style,
  canvasColor,
  contentInsetBottom = false,
}: ScrollScreenProps) {
  const shell = useAppShell();
  const tabBarInset = useTabBarInset();
  const inset =
    contentInsetBottom === true
      ? tabBarInset
      : typeof contentInsetBottom === 'number'
        ? contentInsetBottom
        : 0;
  const bg = canvasColor ?? shell.canvas;
  const showDots = dotBackground && shell.showDotBackground;
  const { contentContainerStyle: scrollContentStyle, ...restScrollProps } = scrollProps ?? {};
  const mergedContentStyle = [
    styles.scrollContent,
    { paddingHorizontal: padH, paddingBottom: spacing.sm + inset },
    scrollContentStyle,
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }, style]} edges={safeAreaEdges}>
      <View style={[styles.fill, { backgroundColor: bg }]}>
        {showDots ? <DotBackground /> : null}
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces
          alwaysBounceVertical
          {...restScrollProps}
          contentContainerStyle={mergedContentStyle}
        >
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: appShell.canvas,
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
});
