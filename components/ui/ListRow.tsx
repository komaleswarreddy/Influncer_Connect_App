import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type TouchableOpacityProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, useAppShell } from '@/theme';
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
  trailing?: React.ReactNode;
};

export function ListRow({
  title,
  subtitle,
  iconName,
  iconColor,
  iconWellColor,
  leftSlot,
  compact,
  status,
  showChevron = true,
  trailing,
  onPress,
  style,
  ...rest
}: Props) {
  const shell = useAppShell();
  const resolvedIconColor = iconColor ?? shell.tabActive;
  const resolvedWell = iconWellColor ?? shell.iceBlue;
  const statusColors: Record<StatusDot, string> = {
    success: shell.success,
    warning: shell.warning,
    neutral: shell.textMuted,
  };

  const content = (
    <View style={[styles.row, compact && styles.rowCompact, style]}>
      {leftSlot != null && React.isValidElement(leftSlot) ? (
        <View style={styles.leftSlot}>{leftSlot}</View>
      ) : iconName ? (
        <View style={[styles.well, { backgroundColor: resolvedWell }]}>
          <Ionicons name={iconName} size={22} color={resolvedIconColor} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: shell.textPrimary }, compact && styles.titleCompact]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              { color: shell.textSecondary },
              compact && styles.subtitleCompact,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing != null && React.isValidElement(trailing) ? (
        <View style={styles.trailing}>{trailing}</View>
      ) : null}
      {status ? (
        <View style={[styles.dot, { backgroundColor: statusColors[status] }]} />
      ) : showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={20} color={shell.textMuted} />
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
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 2,
  },
  titleCompact: {
    fontSize: 14,
  },
  subtitleCompact: {
    fontSize: 11,
    marginTop: 1,
  },
  trailing: {
    marginLeft: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.sm,
  },
});
