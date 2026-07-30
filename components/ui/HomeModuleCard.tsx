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
import { spacing, radius, shadow, useAppShell } from '@/theme';
import { fonts } from './typography';
import { HomeModuleIconWell, type HomeModuleIconVariant } from './HomeModuleIconWell';

type Props = {
  title: string;
  subtitle: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  /** Premium gradient icon variant (default). */
  iconVariant?: HomeModuleIconVariant;
  /** Legacy flat icon — used when iconVariant is omitted. */
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconWellColor?: string;
};

/** Full-width Home shortcut — matches Campaign Health card chrome. */
export function HomeModuleCard({
  title,
  subtitle,
  onPress,
  style,
  iconVariant,
  icon,
  iconColor,
  iconWellColor,
}: Props) {
  const shell = useAppShell();
  const resolvedIconColor = iconColor ?? shell.cta;
  const resolvedWell = iconWellColor ?? shell.iceBlue;
  return (
    <TouchableOpacity
      style={[
        styles.card,
        shadow.card,
        { backgroundColor: shell.card, borderColor: shell.cardBorder },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {iconVariant ? (
        <HomeModuleIconWell variant={iconVariant} size={48} />
      ) : icon ? (
        <View style={[styles.iconWell, { backgroundColor: resolvedWell }]}>
          <Ionicons name={icon} size={22} color={resolvedIconColor} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <Text style={[styles.title, { color: shell.textPrimary }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: shell.textSecondary }]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <View
        style={[
          styles.chevronWell,
          { backgroundColor: shell.canvasAlt, borderColor: shell.borderSubtle },
        ]}
      >
        <Ionicons name="chevron-forward" size={18} color={shell.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  iconWell: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.3,
    lineHeight: 22,
    marginBottom: 2,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  chevronWell: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
