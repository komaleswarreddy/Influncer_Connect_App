import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppShell } from '@/theme';
import { fonts } from './typography';

type Props = {
  unreadCount: number;
  onPress: () => void;
};

/** Premium Home header bell — navy well, white outline icon, themed count badge. */
export function HomeNotificationBell({ unreadCount, onPress }: Props) {
  const shell = useAppShell();
  const wellBg = shell.isDark ? '#1E2A44' : '#141E33';
  const showBadge = unreadCount > 0;
  const label = showBadge ? (unreadCount > 99 ? '99+' : String(unreadCount)) : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.hit}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={showBadge ? `Notifications, ${unreadCount} unread` : 'Notifications'}
    >
      <View style={[styles.well, { backgroundColor: wellBg }]}>
        <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
        {showBadge ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: shell.isDark ? shell.cta : '#FFFFFF',
                borderColor: wellBg,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: shell.isDark ? '#0B1220' : wellBg }]}>
              {label}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hit: {
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  well: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});
