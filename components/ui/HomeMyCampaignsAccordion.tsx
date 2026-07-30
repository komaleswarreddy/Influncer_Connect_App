import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppShell } from '@/theme';
import { fonts } from './typography';

type Props = {
  activeCount: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** My Campaigns entry — navigates to Mine tab (no inline list). */
export function HomeMyCampaignsAccordion({ activeCount, onPress, style }: Props) {
  const shell = useAppShell();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`My Campaigns, ${activeCount} active. Open Mine tab.`}
      style={[
        styles.shell,
        {
          backgroundColor: shell.card,
          borderColor: shell.cardBorder,
        },
        style,
      ]}
    >
      <View style={[styles.iconWell, { backgroundColor: shell.isDark ? '#1E2A44' : '#141E33' }]}>
        <Ionicons name="folder-open" size={20} color="#FFFFFF" />
      </View>
      <View style={styles.headerCopy}>
        <Text style={[styles.title, { color: shell.textPrimary }]}>My Campaigns</Text>
        <Text style={[styles.subtitle, { color: shell.textSecondary }]}>
          {activeCount === 0 ? 'No active campaigns' : `${activeCount} active`}
        </Text>
      </View>
      <View style={[styles.countPill, { backgroundColor: shell.isDark ? '#1E2A44' : '#141E33' }]}>
        <Text style={styles.countPillText}>{activeCount}</Text>
      </View>
      <View style={[styles.chevronWell, { backgroundColor: shell.iceBlue }]}>
        <Ionicons name="chevron-forward" size={16} color={shell.cta} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 30,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 72,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 28,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.35,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  countPill: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  countPillText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  chevronWell: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
