import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useKollab, type KollabTokens } from '@/theme/kollab-tokens';

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
  const kollab = useKollab();
  const styles = useKollabStyles(kollab);
  const isCompact = compact && !comfortable;
  return (
    <View style={[styles.row, isCompact && styles.rowCompact]}>
      <View style={styles.textBlock}>
        {overline ? (
          <Text style={[styles.overline, isCompact && styles.overlineCompact]}>{overline}</Text>
        ) : null}
        <Text style={[styles.title, isCompact && styles.titleCompact]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

function useKollabStyles(kollab: KollabTokens) {
  return useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: kollab.space.md,
        },
        rowCompact: {
          marginBottom: kollab.space.sm,
        },
        textBlock: { flex: 1, paddingRight: kollab.space.sm },
        overline: {
          fontFamily: kollab.font.bold,
          fontSize: 12,
          letterSpacing: 0.72,
          textTransform: 'uppercase',
          opacity: 0.55,
          color: kollab.color.ink,
          marginBottom: 6,
        },
        title: {
          fontFamily: kollab.font.display,
          fontSize: 28,
          letterSpacing: -0.5,
          lineHeight: 32,
          color: kollab.color.ink,
        },
        subtitle: {
          fontFamily: kollab.font.body,
          fontSize: 14,
          marginTop: 6,
          lineHeight: 21,
          color: kollab.color.inkMuted,
        },
        overlineCompact: {
          fontSize: 10.5,
          letterSpacing: 0.6,
          marginBottom: 4,
        },
        titleCompact: {
          fontSize: 20,
          letterSpacing: -0.6,
          lineHeight: 24,
        },
        subtitleCompact: {
          fontSize: 12.5,
          marginTop: 4,
          lineHeight: 17,
        },
      }),
    [kollab]
  );
}
