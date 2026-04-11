import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appShell, radius, spacing } from '@/theme';
import { fonts } from './typography';

export type StatusDot = 'success' | 'warning' | 'neutral';

type Props = TouchableOpacityProps & {
  title: string;
  subtitle?: string;
  /** Ionicons name for left icon */
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  /** Pastel well behind icon */
  iconWellColor?: string;
  /** Replaces default icon well (e.g. glass social icon) */
  leftSlot?: React.ReactNode;
  /** Smaller title/subtitle (dense dashboard rows) */
  compact?: boolean;
  status?: StatusDot;
  showChevron?: boolean;
};

const dotColor: Record<StatusDot, string> = {
  success: appShell.success,
  warning: appShell.warning,
  neutral: appShell.textMuted,
};

export function ListRow({
  title,
  subtitle,
  iconName,
  iconColor = appShell.tabActive,
  iconWellColor = appShell.iceBlue,
  leftSlot,
  compact,
  status,
  showChevron = true,
  onPress,
  style,
  ...rest
}: Props) {
  const content = (
    <View style={[styles.row, compact && styles.rowCompact, style]}>
      {leftSlot ? (
        <View style={styles.leftSlot}>{leftSlot}</View>
      ) : iconName ? (
        <View style={[styles.well, { backgroundColor: iconWellColor }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>{subtitle}</Text> : null}
      </View>
      {status ? (
        <View style={[styles.dot, { backgroundColor: dotColor[status] }]} />
      ) : showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={20} color={appShell.textMuted} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} {...rest}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View {...rest}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  rowCompact: {
    paddingVertical: spacing.xs,
  },
  leftSlot: {
    marginRight: spacing.md,
  },
  well: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textWrap: { flex: 1 },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: appShell.textPrimary,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: appShell.textSecondary,
    marginTop: 2,
  },
  titleCompact: {
    fontSize: 14,
  },
  subtitleCompact: {
    fontSize: 11,
    marginTop: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.sm,
  },
});
