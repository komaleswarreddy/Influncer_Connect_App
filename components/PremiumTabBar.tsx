import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { appShell, palette, premiumButton } from '@/theme';
import { fonts } from '@/components/ui/typography';
/**
 * White bar + active tab: glossy navy pill (same gradient/gloss as PrimaryButton), narrow width.
 */
export function PremiumTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeKey = state.routes[state.index]?.key;
  const hiddenTabs = new Set(['ugc-jobs', 'bookings', 'ratings', 'inbox']);
  const visibleRoutes = state.routes.filter((route) => !hiddenTabs.has(route.name));

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.bar}>
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;
          const isFocused = route.key === activeKey;
          const inactiveColor = appShell.textSecondary;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const icon =
            options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? palette.white : inactiveColor,
              size: 19,
            }) ?? null;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabTouchable}
              activeOpacity={0.88}
            >
              {isFocused ? (
                <View style={styles.activeOuter}>
                  <LinearGradient
                    colors={[...premiumButton.baseGradient]}
                    locations={[...premiumButton.baseLocations]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.activeGradient}
                  >
                    <LinearGradient
                      colors={[...premiumButton.glossGradient]}
                      locations={[...premiumButton.glossLocations]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.activeGloss}
                      pointerEvents="none"
                    />
                    <View style={styles.iconWrap}>{icon}</View>
                    <Text style={styles.labelActive} numberOfLines={1}>
                      {String(label)}
                    </Text>
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.inactiveInner}>
                  {icon}
                  <Text style={[styles.labelInactive, { color: inactiveColor }]} numberOfLines={1}>
                    {String(label)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: { position: 'relative' },
  wrap: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingTop: 2,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: appShell.tabBarBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  tabTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** Narrow pill â€” does not stretch full tab column */
  activeOuter: {
    alignSelf: 'center',
    maxWidth: 80,
    minWidth: 64,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: premiumButton.rimOuter,
    ...Platform.select({
      ios: {
        shadowColor: premiumButton.shadowColor,
        shadowOffset: premiumButton.shadowOffset,
        shadowOpacity: premiumButton.shadowOpacity * 0.85,
        shadowRadius: premiumButton.shadowRadius,
      },
      android: { elevation: 8 },
    }),
  },
  activeGradient: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minWidth: 64,
  },
  activeGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  inactiveInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  labelActive: {
    fontFamily: fonts.semiBold,
    fontSize: 8,
    letterSpacing: 0.35,
    marginTop: 2,
    color: palette.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  labelInactive: {
    fontFamily: fonts.semiBold,
    fontSize: 8,
    letterSpacing: 0.3,
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
