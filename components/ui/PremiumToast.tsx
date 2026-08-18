import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKollab, font } from '@/theme/kollab-tokens';

export type PremiumToastPayload = {
  title: string;
  message?: string;
  durationMs?: number;
};

type Listener = (payload: PremiumToastPayload) => void;

const listeners = new Set<Listener>();

function lineFor(payload: PremiumToastPayload): string {
  const title = payload.title.trim();
  const message = payload.message?.trim();
  if (message && title && message !== title) return `${title} — ${message}`;
  return message || title;
}

/** Imperative toast — works from any screen without prop drilling. */
export function showPremiumToast(payload: PremiumToastPayload) {
  listeners.forEach((fn) => fn(payload));
}

/** HTML `flash(msg)` — top cream/ink pill, ~2s. */
export function showKollabToast(message: string, durationMs = 2000) {
  const text = message.trim();
  if (!text) return;
  showPremiumToast({ title: text, durationMs });
}

/**
 * Mount once near the app root. Renders the Kollab top pill from Creator App.dc.html.
 */
export function PremiumToastHost() {
  const insets = useSafeAreaInsets();
  const kollab = useKollab();
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -16, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setText('');
    });
  }, [opacity, translateY]);

  const show = useCallback(
    (next: PremiumToastPayload) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setText(lineFor(next));
      setVisible(true);
      opacity.setValue(0);
      translateY.setValue(-16);
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      const duration = next.durationMs ?? 2000;
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

  if (!visible || !text) return null;

  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 10 }]}>
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: kollab.color.panel,
            shadowColor: kollab.color.shadowColor,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={[styles.label, { color: kollab.color.panelInk }]} numberOfLines={2}>
          {text}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 22,
    right: 22,
    zIndex: 9999,
    elevation: 24,
    alignItems: 'center',
  },
  toast: {
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 19,
    maxWidth: '100%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  label: {
    fontFamily: font.semiBold,
    fontSize: 13,
    textAlign: 'center',
  },
});
