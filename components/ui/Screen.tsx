import React from 'react';
import { View, StyleSheet, ScrollView, type ScrollViewProps, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { appShell, spacing } from '@/theme';
import { DotBackground } from './DotBackground';

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
  return (
    <SafeAreaView style={[styles.safe, style]} edges={safeAreaEdges} {...rest}>
      <View style={[styles.fill, { backgroundColor: appShell.canvas }]}>
        {dotBackground ? <DotBackground /> : null}
        <View style={[styles.inner, { paddingHorizontal: padH }]}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

type ScrollScreenProps = Omit<ScreenProps, 'children'> & {
  children: React.ReactNode;
  scrollProps?: ScrollViewProps;
};

export function ScrollScreen({
  children,
  dotBackground = true,
  safeAreaEdges = ['top', 'left', 'right'],
  padH = spacing.lg,
  scrollProps,
  style,
}: ScrollScreenProps) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={safeAreaEdges}>
      <View style={[styles.fill, { backgroundColor: appShell.canvas }]}>
        {dotBackground ? <DotBackground /> : null}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: padH }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...scrollProps}
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
    paddingBottom: spacing.lg,
  },
});
