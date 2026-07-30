import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { radius, spacing, useAppShell } from '@/theme';
import { fonts } from '@/components/ui/typography';
import { getPlatformLabel, type SupportedPlatform } from '@/lib/post-url-parser';

export type PlatformFilter = 'all' | SupportedPlatform;

type Props = {
  selected: PlatformFilter;
  onSelect: (platform: PlatformFilter) => void;
  totalCount: number;
  platformCounts: Record<string, number>;
};

export function MyStatsPlatformPills({ selected, onSelect, totalCount, platformCounts }: Props) {
  const shell = useAppShell();
  const platforms = Object.keys(platformCounts) as SupportedPlatform[];

  const renderPill = (platform: PlatformFilter) => {
    const active = selected === platform;
    const count = platform === 'all' ? totalCount : (platformCounts[platform] ?? 0);
    const label = platform === 'all' ? 'All' : getPlatformLabel(platform);

    return (
      <TouchableOpacity
        key={platform}
        style={[
          styles.pill,
          {
            backgroundColor: active ? shell.cta : shell.canvasAlt,
            borderColor: active ? shell.cta : shell.cardBorder,
          },
        ]}
        onPress={() => onSelect(platform)}
        activeOpacity={0.85}
      >
        <Text style={[styles.pillText, { color: active ? '#FFFFFF' : shell.textPrimary }]}>
          {label} {count}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {renderPill('all')}
      {platforms.map((platform) => renderPill(platform))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
});
