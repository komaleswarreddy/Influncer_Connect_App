import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appShell } from '@/theme';
import { fonts } from './typography';

export type UnderlineTab = {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

type Props = {
  tabs: UnderlineTab[];
  value: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
};

export function UnderlineTabBar({ tabs, value, onChange, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      {tabs.map((tab) => {
        const active = value === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <View style={styles.tabInner}>
              {tab.icon ? (
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={active ? appShell.cta : appShell.textSecondary}
                />
              ) : null}
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </View>
            <View style={[styles.indicator, active && styles.indicatorActive]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: appShell.borderSubtle,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 0,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
    minHeight: 22,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: appShell.textSecondary,
    textAlign: 'center',
  },
  labelActive: {
    fontFamily: fonts.bold,
    color: appShell.cta,
  },
  indicator: {
    marginTop: 8,
    height: 2,
    width: '72%',
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: appShell.cta,
  },
});

