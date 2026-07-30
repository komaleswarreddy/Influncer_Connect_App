import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { premiumButton } from '@/theme';
import { HomeModuleLuxuryIcon } from './HomeModuleLuxuryIcon';

export type HomeModuleIconVariant =
  'priceCard' | 'rateCalculator' | 'trending' | 'createProducts' | 'schedule' | 'autoDm';

/** Shared premium navy → ice gradient for all Quick Action wells. */
export const PREMIUM_ICON_GRADIENT = ['#141E33', '#2A3A5C', '#8E9EED'] as const;
export const PREMIUM_ICON_ACCENT = '#8E9EED';

export const VARIANT_GRADIENT: Record<
  HomeModuleIconVariant,
  readonly [string, string, ...string[]]
> = {
  priceCard: PREMIUM_ICON_GRADIENT,
  rateCalculator: PREMIUM_ICON_GRADIENT,
  trending: PREMIUM_ICON_GRADIENT,
  createProducts: PREMIUM_ICON_GRADIENT,
  schedule: PREMIUM_ICON_GRADIENT,
  autoDm: PREMIUM_ICON_GRADIENT,
};

export const VARIANT_ACCENT: Record<HomeModuleIconVariant, string> = {
  priceCard: PREMIUM_ICON_ACCENT,
  rateCalculator: PREMIUM_ICON_ACCENT,
  trending: PREMIUM_ICON_ACCENT,
  createProducts: PREMIUM_ICON_ACCENT,
  schedule: PREMIUM_ICON_ACCENT,
  autoDm: PREMIUM_ICON_ACCENT,
};

type Props = {
  variant: HomeModuleIconVariant;
  size?: number;
};

const TILE_RADIUS = 18;

/** Glass-tile luxury icon — rounded square, inner glow, custom SVG glyph. */
export function HomeModuleIconWell({ variant, size = 52 }: Props) {
  const iconSize = Math.round(size * 0.54);
  const gradient = VARIANT_GRADIENT[variant];

  return (
    <View
      style={[
        styles.tileOuter,
        {
          width: size,
          height: size,
          borderRadius: TILE_RADIUS,
        },
      ]}
    >
      <LinearGradient
        colors={[...gradient]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[styles.fill, { borderRadius: TILE_RADIUS }]}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.04)', 'transparent']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.innerGlow, { borderRadius: TILE_RADIUS }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[...premiumButton.glossGradient]}
        locations={[...premiumButton.glossLocations]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[
          styles.gloss,
          { borderTopLeftRadius: TILE_RADIUS, borderTopRightRadius: TILE_RADIUS },
        ]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.16)']}
        start={{ x: 0.5, y: 0.55 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.bottomShade, { borderRadius: TILE_RADIUS }]}
        pointerEvents="none"
      />
      <View style={[styles.glassVeil, { borderRadius: TILE_RADIUS }]} pointerEvents="none" />
      <View
        style={[
          styles.specular,
          {
            width: size * 0.46,
            height: size * 0.18,
            borderRadius: TILE_RADIUS * 0.55,
            top: size * 0.11,
          },
        ]}
        pointerEvents="none"
      />
      <View style={[styles.bevelRim, { borderRadius: TILE_RADIUS }]} pointerEvents="none" />
      <View style={styles.glyph}>
        <HomeModuleLuxuryIcon variant={variant} size={iconSize} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tileOuter: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
  },
  bottomShade: {
    ...StyleSheet.absoluteFillObject,
  },
  glassVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  specular: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    transform: [{ rotate: '-10deg' }],
  },
  bevelRim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.42)',
    borderLeftColor: 'rgba(255, 255, 255, 0.18)',
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  glyph: {
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
