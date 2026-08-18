import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, FeGaussianBlur, Filter, G, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useKollab } from '@/theme/kollab-tokens';
import { Glyph, type GlyphName } from './ui/Glyph';

const HIDDEN_TABS = new Set<string>();

/**
 * Extra canvas around the 374×88 shell so FeGaussianBlur isn't clipped at the SVG bounds.
 * Translate the path in by this amount on every side.
 */
const SVG_PAD = 40;
const SHELL_VB_W = 374;
const SHELL_VB_H = 88;
const SVG_VB_W = SHELL_VB_W + SVG_PAD * 2;
const SVG_VB_H = SHELL_VB_H + SVG_PAD * 2;

const NAV_SHELL_PATH =
  'M 32 0 H 121 C 144 0 149 5 156 15 C 164 27 174 35 187 35 C 200 35 210 27 218 15 C 225 5 230 0 253 0 H 342 Q 374 0 374 32 V 56 Q 374 88 342 88 H 32 Q 0 88 0 56 V 32 Q 0 0 32 0 Z';

/** Path-traced drop shadow — RN elevation follows the View rect and hides the scallop. */
const NAV_SHADOWS = [
  { id: 'kollabNavBlur1', dy: 1, blur: 1, fill: 'rgba(23,20,16,0.10)' },
  { id: 'kollabNavBlur2', dy: 3, blur: 6, fill: 'rgba(23,20,16,0.07)' },
  { id: 'kollabNavBlur3', dy: 8, blur: 14, fill: 'rgba(23,20,16,0.06)' },
] as const;

const TAB_ICON: Record<string, GlyphName> = {
  dashboard: 'home',
  campaigns: 'layers',
  'my-stats': 'bars',
  account: 'gear',
};

export function KollabTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const kollab = useKollab();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const activeKey = state.routes[state.index]?.key;
  const visibleRoutes = state.routes.filter((route) => !HIDDEN_TABS.has(route.name));
  const [navL, navR] = [visibleRoutes.slice(0, 2), visibleRoutes.slice(2, 4)];

  const barH = kollab.nav.height;
  const fabSize = kollab.nav.fabSize;
  const ground = kollab.color.screen;
  const floatBottom = kollab.nav.insetBottom + insets.bottom;

  const renderTab = (route: (typeof visibleRoutes)[number]) => {
    const { options } = descriptors[route.key];
    const label =
      typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);
    const isFocused = route.key === activeKey;
    const color = isFocused ? kollab.color.navActive : kollab.color.navIdle;
    const glyphName = TAB_ICON[route.name] ?? 'home';

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

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={styles.tab}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
      >
        <Glyph name={glyphName} color={color} size={kollab.nav.iconSize} />
        <Text
          style={[
            styles.tabLabel,
            { color, fontWeight: isFocused ? '700' : '500', fontSize: kollab.nav.labelSize },
          ]}
          numberOfLines={1}
        >
          {String(label)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          left: kollab.nav.insetX - SVG_PAD,
          right: kollab.nav.insetX - SVG_PAD,
          bottom: floatBottom - SVG_PAD,
          height: barH + SVG_PAD * 2,
          zIndex: 30,
        },
      ]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SVG_VB_W} ${SVG_VB_H}`}
        preserveAspectRatio="none"
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          {NAV_SHADOWS.map((layer) => (
            <Filter key={layer.id} id={layer.id} x="-50%" y="-50%" width="200%" height="200%">
              <FeGaussianBlur stdDeviation={layer.blur} />
            </Filter>
          ))}
        </Defs>
        {NAV_SHADOWS.map((layer) => (
          <G
            key={layer.id}
            transform={`translate(${SVG_PAD}, ${SVG_PAD + layer.dy})`}
            filter={`url(#${layer.id})`}
          >
            <Path d={NAV_SHELL_PATH} fill={layer.fill} />
          </G>
        ))}
        <G transform={`translate(${SVG_PAD}, ${SVG_PAD})`}>
          <Path
            d={NAV_SHELL_PATH}
            fill={ground}
            stroke="rgba(23,20,16,0.07)"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </G>
      </Svg>

      <Pressable
        onPress={() => router.push('/account-screens/instagram-hub' as never)}
        style={[
          styles.fab,
          {
            width: fabSize,
            height: fabSize,
            marginLeft: -fabSize / 2,
            top: SVG_PAD + kollab.nav.fabOffsetY,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Open Instagram"
      >
        <LinearGradient
          colors={kollab.fabGradient}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={[StyleSheet.absoluteFillObject, styles.fabFill]}
        >
          <Glyph name="plus" color={kollab.color.chartreuse} size={22} />
        </LinearGradient>
      </Pressable>

      <View style={[styles.tabRow, { top: SVG_PAD, height: barH, left: SVG_PAD, right: SVG_PAD }]}>
        {navL.map(renderTab)}
        <View style={{ width: kollab.nav.notchSpacer, flexShrink: 0 }} />
        {navR.map(renderTab)}
      </View>
      <View
        style={[
          styles.homeIndicator,
          {
            top: SVG_PAD + barH - 13,
            backgroundColor: Platform.OS === 'ios' ? kollab.color.hairline : 'transparent',
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
  fab: {
    position: 'absolute',
    left: '50%',
    borderRadius: 999,
    zIndex: 2,
  },
  fabFill: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: 18,
    paddingHorizontal: 6,
    zIndex: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    fontFamily: 'InstrumentSans_600SemiBold',
  },
  homeIndicator: {
    position: 'absolute',
    left: '50%',
    marginLeft: -66,
    width: 132,
    height: 4,
    borderRadius: 999,
    zIndex: 1,
  },
});

export default KollabTabBar;
