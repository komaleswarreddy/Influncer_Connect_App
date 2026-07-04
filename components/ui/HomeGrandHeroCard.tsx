import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appShell, radius, shadow, spacing } from '@/theme';
import { fonts } from './typography';

type Props = {
  greeting: string;
  metricValue: string;
  metricLabel: string;
  actionLabel?: string;
  onActionPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Linear-style calm hero — light surface, grand metric, restrained accent. */
export function HomeGrandHeroCard({
  greeting,
  metricValue,
  metricLabel,
  actionLabel = 'View full stats',
  onActionPress,
  style,
}: Props) {
  return (
    <View style={[styles.shell, shadow.cardLight, style]}>
      <View style={styles.accentRail} />
      <View style={styles.inner}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.metricLabel}>{metricLabel}</Text>
        <Text
          style={styles.metricValue}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {metricValue}
        </Text>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={onActionPress}
          activeOpacity={0.72}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={15} color={appShell.cta} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.xl,
    backgroundColor: appShell.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentRail: {
    width: 3,
    backgroundColor: appShell.cta,
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: appShell.textSecondary,
    letterSpacing: -0.1,
  },
  metricLabel: {
    marginTop: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: appShell.textSecondary,
  },
  metricValue: {
    marginTop: spacing.xxs,
    fontFamily: fonts.bold,
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: -1.6,
    color: appShell.textPrimary,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  actionRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: appShell.cta,
    letterSpacing: -0.1,
  },
});
