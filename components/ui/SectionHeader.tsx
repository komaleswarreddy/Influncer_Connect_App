import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, useAppShell } from '@/theme';
import { fonts } from './typography';

type Props = {
  title: string;
  subtitle?: string;
  /** Uppercase micro label (e.g. section KPI) */
  overline?: string;
  right?: React.ReactNode;
  /** Smaller type scale (default: true) */
  compact?: boolean;
  /** Opt out — larger title/subtitle scale */
  comfortable?: boolean;
};

export function SectionHeader({
  title,
  subtitle,
  overline,
  right,
  compact = true,
  comfortable = false,
}: Props) {
  const shell = useAppShell();
  const isCompact = compact && !comfortable;
  return (
    <View style={[styles.row, isCompact && styles.rowCompact]}>
      <View style={styles.textBlock}>
        {overline ? (
          <Text
            style={[
              styles.overline,
              { color: shell.textSecondary },
              isCompact && styles.overlineCompact,
            ]}
          >
            {overline}
          </Text>
        ) : null}
        <Text
          style={[styles.title, { color: shell.textPrimary }, isCompact && styles.titleCompact]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              { color: shell.textSecondary },
              isCompact && styles.subtitleCompact,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  rowCompact: {
    marginBottom: spacing.sm,
  },
  textBlock: { flex: 1, paddingRight: spacing.sm },
  overline: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    letterSpacing: -0.7,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: 6,
    lineHeight: 21,
  },
  overlineCompact: {
    fontSize: 9,
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  titleCompact: {
    fontSize: 18,
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  subtitleCompact: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
});
