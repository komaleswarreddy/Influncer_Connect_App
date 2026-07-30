import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { appShell, premiumButton, radius, spacing } from '@/theme';
import { fonts } from './typography';

export type PremiumToastPayload = {
  title: string;
  message?: string;
  durationMs?: number;
};

type Listener = (payload: PremiumToastPayload) => void;

const listeners = new Set<Listener>();

/** Imperative toast — works from any screen without prop drilling. */
export function showPremiumToast(payload: PremiumToastPayload) {
  listeners.forEach((fn) => fn(payload));
}

/**
 * Mount once near the app root. Renders a navy slide-up banner.
 */
export function PremiumToastHost() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<PremiumToastPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 24, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setPayload(null);
    });
  }, [opacity, translateY]);

  const show = useCallback(
    (next: PremiumToastPayload) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setPayload(next);
      setVisible(true);
      opacity.setValue(0);
      translateY.setValue(24);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 80,
        }),
      ]).start();
      const duration = next.durationMs ?? 2800;
      hideTimer.current = setTimeout(hide, duration);
    },
    [hide, opacity, translateY]
  );

  useEffect(() => {
    listeners.add(show);
    return () => {
      listeners.delete(show);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [show]);

  if (!visible || !payload) return null;

  return (
    <View pointerEvents="none" style={[styles.host, { bottom: Math.max(insets.bottom, 12) + 64 }]}>
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <LinearGradient
          colors={[...premiumButton.baseGradient]}
          locations={[...premiumButton.baseLocations]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.toast}
        >
          <Text style={styles.title} numberOfLines={2}>
            {payload.title}
          </Text>
          {payload.message ? (
            <Text style={styles.message} numberOfLines={3}>
              {payload.message}
            </Text>
          ) : null}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    elevation: 20,
  },
  toast: {
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: premiumButton.rimOuter,
    shadowColor: appShell.cta,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: premiumButton.labelColor,
    letterSpacing: 0.2,
  },
  message: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
  },
});
