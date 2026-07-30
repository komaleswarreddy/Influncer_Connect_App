import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import { VARIANT_ACCENT, VARIANT_GRADIENT, type HomeModuleIconVariant } from './HomeModuleIconWell';

type Props = {
  variant: HomeModuleIconVariant;
  /** Outer footprint including the soft halo ring. */
  size?: number;
  /** Solid disc as fraction of size (default 0.72). Use ~0.84 for existing-user Quick Actions. */
  discRatio?: number;
};

const SYMBOL_MAP: Record<
  HomeModuleIconVariant,
  { ios: SFSymbol; android: React.ComponentProps<typeof MaterialIcons>['name'] }
> = {
  priceCard: { ios: 'tag.fill', android: 'local-offer' },
  rateCalculator: { ios: 'plus.forwardslash.minus', android: 'calculate' },
  trending: { ios: 'flame.fill', android: 'local-fire-department' },
  createProducts: { ios: 'shippingbox.fill', android: 'inventory-2' },
  schedule: { ios: 'calendar', android: 'event' },
  autoDm: { ios: 'bubble.left.and.bubble.right.fill', android: 'forum' },
};

function Glyph({ variant, size }: { variant: HomeModuleIconVariant; size: number }) {
  const { ios, android } = SYMBOL_MAP[variant];
  const fallback = <MaterialIcons name={android} size={size} color="#FFFFFF" />;

  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={ios}
        tintColor="#FFFFFF"
        size={size}
        weight="semibold"
        type="monochrome"
        fallback={fallback}
      />
    );
  }

  return fallback;
}

/** Premium circular gradient icon with soft halo — matches dashboard reference style. */
export function QuickSetupSymbolWell({ variant, size = 64, discRatio = 0.72 }: Props) {
  const gradient = VARIANT_GRADIENT[variant];
  const accent = VARIANT_ACCENT[variant];
  const innerSize = Math.round(size * discRatio);
  const iconSize = Math.round(innerSize * 0.46);
  const haloSize = size;

  return (
    <View
      style={[
        styles.root,
        {
          width: haloSize,
          height: haloSize,
        },
      ]}
    >
      <LinearGradient
        colors={[`${accent}55`, `${accent}18`, 'transparent']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[
          styles.halo,
          {
            width: haloSize,
            height: haloSize,
            borderRadius: haloSize / 2,
          },
        ]}
      />

      <View
        style={[
          styles.innerShadowHost,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        <LinearGradient
          colors={[...gradient]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[
            styles.innerDisc,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[
              styles.innerSheen,
              {
                width: innerSize,
                height: innerSize,
                borderRadius: innerSize / 2,
              },
            ]}
            pointerEvents="none"
          />
          <Glyph variant={variant} size={iconSize} />
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    opacity: 0.95,
  },
  innerShadowHost: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  innerDisc: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  innerSheen: {
    ...StyleSheet.absoluteFillObject,
  },
});
