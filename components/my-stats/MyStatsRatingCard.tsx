import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appShell, radius, shadow, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';
import type { RatingSummary } from '@/lib/my-stats-dashboard-stats';

type Props = {
  summary: RatingSummary;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

function StarRow({ average }: { average: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i += 1) {
    const filled = average >= i - 0.25;
    stars.push(
      <Ionicons
        key={i}
        name={filled ? 'star' : 'star-outline'}
        size={14}
        color="#4F6EF7"
        style={styles.star}
      />
    );
  }
  return <View style={styles.starRow}>{stars}</View>;
}

export function MyStatsRatingCard({ summary, onPress, style }: Props) {
  const hasRatings = summary.count > 0;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} accessibilityRole="button" style={style}>
      <View style={[styles.card, shadow.card]}>
        <View style={styles.starWell}>
          <Ionicons name="star" size={20} color="#FFFFFF" />
        </View>

        <View style={styles.copy}>
          <Text style={styles.label}>AVERAGE RATING</Text>
          <Text style={styles.value}>{hasRatings ? summary.average.toFixed(1) : '—'}</Text>
          {hasRatings ? <StarRow average={summary.average} /> : null}
          <Text style={styles.hint}>
            {hasRatings
              ? `Based on ${summary.count} rated campaign${summary.count === 1 ? '' : 's'}`
              : 'Tap to rate your campaigns'}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={appShell.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appShell.card,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  starWell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F6EF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: appShell.textSecondary,
    textTransform: 'uppercase',
  },
  value: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 26,
    color: appShell.textPrimary,
    letterSpacing: -0.6,
  },
  starRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },
  star: {
    marginRight: 0,
  },
  hint: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: appShell.textSecondary,
  },
});
