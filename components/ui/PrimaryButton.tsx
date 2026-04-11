import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type TouchableOpacityProps,
  Platform,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { premiumButton } from '@/theme';
import { fonts } from './typography';

type Props = TouchableOpacityProps & {
  label: string;
  loading?: boolean;
  /** Tighter padding for inline / hero CTAs */
  compact?: boolean;
  /** Fully rounded pill (matches premium tab + reference buttons) */
  pill?: boolean;
};

/** Filled CTA — same navy satin gradient as premium auth pills. */
export function PrimaryButton({ label, loading, disabled, style, compact, pill, ...rest }: Props) {
  const dim = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      disabled={dim}
      style={[styles.outer, pill && styles.outerPill, dim && styles.dim, style]}
      {...rest}
    >
      <LinearGradient
        colors={[...premiumButton.baseGradient]}
        locations={[...premiumButton.baseLocations]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.gradient, compact && styles.gradientCompact, pill && styles.gradientPill]}
      >
        <LinearGradient
          colors={[...premiumButton.glossGradient]}
          locations={[...premiumButton.glossLocations]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.glossOverlay, pill && styles.glossOverlayPill]}
          pointerEvents="none"
        />
        <View style={styles.rimLine} pointerEvents="none" />
        {loading ? (
          <ActivityIndicator color={premiumButton.labelColor} />
        ) : (
          <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: premiumButton.rimOuter,
    ...Platform.select({
      ios: {
        shadowColor: premiumButton.shadowColor,
        shadowOffset: premiumButton.shadowOffset,
        shadowOpacity: premiumButton.shadowOpacity,
        shadowRadius: premiumButton.shadowRadius,
      },
      android: { elevation: premiumButton.elevation },
    }),
  },
  outerPill: {
    borderRadius: 999,
  },
  dim: { opacity: 0.55 },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    overflow: 'hidden',
  },
  gradientCompact: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    minHeight: 44,
  },
  gradientPill: {
    borderRadius: 999,
  },
  glossOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  glossOverlayPill: {
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  rimLine: {
    position: 'absolute',
    top: 1,
    left: '6%',
    right: '6%',
    height: 1,
    backgroundColor: premiumButton.rimLine,
    opacity: 0.85,
    borderRadius: 1,
  },
  label: {
    fontFamily: fonts.semiBold,
    color: premiumButton.labelColor,
    fontSize: 15,
    letterSpacing: 0.3,
    zIndex: 1,
  },
  labelCompact: {
    fontSize: 13,
    letterSpacing: 0.25,
  },
});
