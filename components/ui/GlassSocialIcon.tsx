import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { premiumButton, radius } from '@/theme';

export type GlassSocialPlatform = 'instagram' | 'youtube' | 'twitter';

const PLATFORM_GRADIENT: Record<
  GlassSocialPlatform,
  readonly [string, string, ...string[]]
> = {
  instagram: ['#F58529', '#DD2A7B', '#8134AF'],
  youtube: ['#FF0000', '#B2071D'],
  twitter: ['#1DA1F2', '#0d8ecf'],
};

type Props = {
  platform: GlassSocialPlatform;
  size?: number;
};

/**
 * 3D glass-style social icon: brand gradient + satin gloss overlay (matches PrimaryButton treatment).
 */
export function GlassSocialIcon({ platform, size = 48 }: Props) {
  const iconSize = Math.round(size * 0.42);
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius.lg }]}>
      <LinearGradient
        colors={[...PLATFORM_GRADIENT[platform]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fill, { borderRadius: radius.lg }]}
      />
      <LinearGradient
        colors={[...premiumButton.glossGradient]}
        locations={[...premiumButton.glossLocations]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.gloss, { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }]}
        pointerEvents="none"
      />
      <View style={styles.rim} pointerEvents="none" />
      <Ionicons
        name={
          platform === 'instagram'
            ? 'logo-instagram'
            : platform === 'youtube'
              ? 'logo-youtube'
              : 'logo-twitter'
        }
        size={iconSize}
        color="#FFFFFF"
        style={styles.icon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '52%',
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  icon: {
    zIndex: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
