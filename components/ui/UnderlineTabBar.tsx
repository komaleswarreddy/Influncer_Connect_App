import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, useAppShell } from '@/theme';
import { fonts } from './typography';

export type UnderlineTab = {
  key: string;
  label: string;
  /** Optional stacked label lines (e.g. Track / Progress). */
  labelLine1?: string;
  labelLine2?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional count badge (e.g. active Mine campaigns). */
  badge?: number;
};

type Props = {
  tabs: UnderlineTab[];
  value: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
  /** When true, tabs scroll horizontally and size to content instead of equal flex. */
  scrollable?: boolean;
};

function TabButton({
  tab,
  active,
  scrollable,
  onPress,
}: {
  tab: UnderlineTab;
  active: boolean;
  scrollable: boolean;
  onPress: () => void;
}) {
  const shell = useAppShell();
  const badge =
    typeof tab.badge === 'number' && tab.badge > 0
      ? tab.badge > 99
        ? '99+'
        : String(tab.badge)
      : null;
  const stacked = Boolean(tab.labelLine1 && tab.labelLine2);
  const activeColor = shell.cta;
  const inactiveColor = shell.textSecondary;

  return (
    <TouchableOpacity
      style={[styles.tab, scrollable && styles.tabScrollable, stacked && styles.tabStacked]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={badge ? `${tab.label}, ${tab.badge} active` : tab.label}
    >
      <View style={[styles.tabInner, stacked && styles.tabInnerStacked]}>
        {tab.icon ? (
          <Ionicons name={tab.icon} size={15} color={active ? activeColor : inactiveColor} />
        ) : null}
        {stacked ? (
          <View style={styles.stackedLabels}>
            <Text
              style={[styles.stackedLine1, { color: active ? activeColor : inactiveColor }]}
              numberOfLines={1}
            >
              {tab.labelLine1}
            </Text>
            <Text
              style={[
                styles.stackedLine2,
                { color: active ? activeColor : inactiveColor },
                active && styles.stackedLine2Active,
              ]}
              numberOfLines={1}
            >
              {tab.labelLine2}
            </Text>
          </View>
        ) : (
          <Text
            style={[
              styles.label,
              { color: active ? activeColor : inactiveColor },
              active && styles.labelActive,
            ]}
            numberOfLines={1}
          >
            {tab.label}
          </Text>
        )}
        {badge ? (
          <View style={[styles.badge, { backgroundColor: activeColor }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.indicator,
          scrollable && styles.indicatorScrollable,
          active && { backgroundColor: activeColor },
        ]}
      />
    </TouchableOpacity>
  );
}

export function UnderlineTabBar({ tabs, value, onChange, style, scrollable = false }: Props) {
  const shell = useAppShell();
  const content = tabs.map((tab) => (
    <TabButton
      key={tab.key}
      tab={tab}
      active={value === tab.key}
      scrollable={scrollable}
      onPress={() => onChange(tab.key)}
    />
  ));

  if (scrollable) {
    return (
      <View style={[styles.row, { borderBottomColor: shell.borderSubtle }, style]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.row, { borderBottomColor: shell.borderSubtle }, style]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 0,
  },
  tabScrollable: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 14,
    minWidth: 'auto',
  },
  tabStacked: {
    paddingTop: 8,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
    minHeight: 22,
  },
  tabInnerStacked: {
    flexDirection: 'column',
    gap: 0,
    minHeight: 32,
  },
  stackedLabels: {
    alignItems: 'center',
    gap: 1,
  },
  stackedLine1: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  stackedLine2: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  stackedLine2Active: {
    fontFamily: fonts.bold,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    textAlign: 'center',
  },
  labelActive: {
    fontFamily: fonts.bold,
  },
  badge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: palette.white,
  },
  indicator: {
    marginTop: 8,
    height: 2,
    width: '72%',
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  indicatorScrollable: {
    width: '100%',
    marginTop: 6,
  },
});
