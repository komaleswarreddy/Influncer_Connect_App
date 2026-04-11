import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { loginScreen, radius } from '@/theme';

const LOTTIE_SOURCE = require('../assets/Social Media Marketing.json');

const BG = loginScreen.background;

/**
 * Hero Lottie for login — soft-tint canvas behind the asset, full-opacity animation in the middle,
 * with edge/corner vignettes only so the frame still blends into the white screen.
 */
export function LoginHeroLottie() {
  const { width: windowWidth } = useWindowDimensions();

  const { frameW, frameH } = useMemo(() => {
    const maxW = Math.min(windowWidth - 40, 380);
    const h = Math.round(maxW * 0.62);
    return { frameW: maxW, frameH: Math.max(160, Math.min(h, 260)) };
  }, [windowWidth]);

  return (
    <View style={[styles.root, { width: frameW }]} pointerEvents="none" accessibilityElementsHidden>
      <View style={[styles.frame, { width: frameW, height: frameH }]}>
        {/* Soft panel behind the animation — reads “premium card” without a hard white block */}
        <LinearGradient
          colors={['#F4F7FD', '#F8FAFD', BG]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <LottieView
          source={LOTTIE_SOURCE}
          autoPlay
          loop
          resizeMode="contain"
          renderMode={Platform.OS === 'android' ? 'HARDWARE' : 'AUTOMATIC'}
          style={styles.lottie}
        />

        {/* Edge vignettes — blend animation into page background */}
        <LinearGradient
          colors={[BG, 'rgba(255,255,255,0)']}
          locations={[0, 1]}
          style={styles.fadeTop}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['rgba(255,255,255,0)', BG]}
          locations={[0, 1]}
          style={styles.fadeBottom}
          pointerEvents="none"
        />
        <LinearGradient
          colors={[BG, 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fadeLeft}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['rgba(255,255,255,0)', BG]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fadeRight}
          pointerEvents="none"
        />

        {/* Corner softness — extra radial-style weight at corners */}
        <LinearGradient
          colors={['rgba(255,255,255,0.35)', 'transparent']}
          style={styles.cornerSheenTL}
          pointerEvents="none"
        />

        <View style={styles.rim} pointerEvents="none" />
      </View>
    </View>
  );
}

const FADE_X = '14%' as const;
const FADE_Y = '22%' as const;

const styles = StyleSheet.create({
  root: {
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  frame: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: loginScreen.primaryDark,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 22,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  lottie: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: FADE_Y,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: FADE_Y,
  },
  fadeLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: FADE_X,
  },
  fadeRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: FADE_X,
  },
  cornerSheenTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '42%',
    height: '38%',
    borderTopLeftRadius: radius.xl,
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
});
