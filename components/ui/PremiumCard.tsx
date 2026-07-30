import React from 'react';
import { View, Text, StyleSheet, type ViewProps } from 'react-native';
import { radius, spacing, shadow, useAppShell } from '@/theme';
import { fonts } from './typography';

type Props = ViewProps & {
  children: React.ReactNode;
  /** Optional title row */
  title?: string;
  /** Right-side node (e.g. icon button) */
  headerRight?: React.ReactNode;
  padded?: boolean;
  /** Tighter padding + smaller radius (default: true) */
  compact?: boolean;
  /** Opt out of compact density — larger radius and padding */
  comfortable?: boolean;
};

export function PremiumCard({
  children,
  title,
  headerRight,
  padded = true,
  compact = true,
  comfortable = false,
  style,
  ...rest
}: Props) {
  const shell = useAppShell();
  const isCompact = compact && !comfortable;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: shell.card,
          borderColor: shell.cardBorder,
        },
        isCompact && styles.cardCompact,
        shadow.card,
        style,
      ]}
      {...rest}
    >
      {title ? (
        <View style={[styles.headerRow, isCompact && styles.headerRowCompact]}>
          <Text
            style={[
              styles.title,
              { color: shell.textPrimary },
              isCompact && styles.titleInlineCompact,
            ]}
          >
            {title}
          </Text>
          {headerRight != null && React.isValidElement(headerRight) ? headerRight : null}
        </View>
      ) : null}
      <View
        style={
          padded
            ? [
                styles.bodyPad,
                isCompact && styles.bodyPadCompact,
                title ? styles.bodyPadAfterHeader : styles.bodyPadNoHeader,
                isCompact &&
                  (title ? styles.bodyPadAfterHeaderCompact : styles.bodyPadNoHeaderCompact),
              ]
            : undefined
        }
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  cardCompact: {
    borderRadius: radius.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerRowCompact: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  titleInlineCompact: {
    fontSize: 16,
  },
  bodyPad: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  bodyPadCompact: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  bodyPadNoHeader: {
    paddingTop: spacing.lg,
  },
  bodyPadNoHeaderCompact: {
    paddingTop: spacing.md,
  },
  bodyPadAfterHeader: {
    paddingTop: spacing.xs,
  },
  bodyPadAfterHeaderCompact: {
    paddingTop: 0,
  },
});
