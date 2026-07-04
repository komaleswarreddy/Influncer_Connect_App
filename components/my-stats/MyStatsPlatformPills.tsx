import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { appShell, radius, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';
import { getPlatformLabel, type SupportedPlatform } from '@/lib/post-url-parser';

export type PlatformFilter = 'all' | SupportedPlatform;

type Props = {
  selected: PlatformFilter;
  onSelect: (platform: PlatformFilter) => void;
  totalCount: number;
  platformCounts: Record<string, number>;
};

export function MyStatsPlatformPills({
  selected,
  onSelect,
  totalCount,
  platformCounts,
}: Props) {
  const platforms = Object.keys(platformCounts) as SupportedPlatform[];

  const renderPill = (platform: PlatformFilter) => {
    const active = selected === platform;
    const count = platform === 'all' ? totalCount : platformCounts[platform] ?? 0;
    const label = platform === 'all' ? 'All' : getPlatformLabel(platform);

    return (
      <TouchableOpacity
        key={platform}
        style={[styles.pill, active && styles.pillActive]}
        onPress={() => onSelect(platform)}
        activeOpacity={0.85}
      >
        <Text style={[styles.pillText, active && styles.pillTextActive]}>
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
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillActive: {
    backgroundColor: appShell.cta,
    borderColor: appShell.cta,
  },
  pillText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: appShell.textPrimary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
