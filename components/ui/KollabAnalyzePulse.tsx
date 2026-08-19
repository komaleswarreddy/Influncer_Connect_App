import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useKollab, font } from '@/theme/kollab-tokens';

const STEPS = ['Reading the post…', 'Pulling live metrics…', 'Scoring engagement…'] as const;

type Props = {
  label?: string;
};

function PulseDot({ delay, color }: { delay: number; color: string }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 640, easing: Easing.inOut(Easing.quad) }), -1, true)
      )
    );
  }, [delay, t]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.get(), [0, 1], [0.28, 1]),
    transform: [{ scale: interpolate(t.get(), [0, 1], [0.72, 1]) }],
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

/** Indeterminate analyze state — lime pulse + scan, no layout animation. */
export function KollabAnalyzePulse({ label }: Props) {
  const kollab = useKollab();
  const [step, setStep] = useState(0);
  const [trackW, setTrackW] = useState(0);
  const scan = useSharedValue(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((prev) => (prev + 1) % STEPS.length);
    }, 900);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    scan.set(0);
    scan.set(
      withRepeat(withTiming(1, { duration: 1280, easing: Easing.inOut(Easing.quad) }), -1, false)
    );
  }, [scan]);

  const barStyle = useAnimatedStyle(() => {
    const travel = Math.max(0, trackW - 72);
    return {
      transform: [{ translateX: interpolate(scan.get(), [0, 1], [-72, travel]) }],
    };
  });

  const status = label ?? STEPS[step];

  return (
    <View
      style={[styles.wrap, { backgroundColor: kollab.color.well }]}
      accessibilityRole="progressbar"
      accessibilityLabel={status}
    >
      <View style={styles.dots}>
        <PulseDot delay={0} color={kollab.color.chartreuse} />
        <PulseDot delay={160} color={kollab.color.chartreuse} />
        <PulseDot delay={320} color={kollab.color.chartreuse} />
      </View>
      <Text style={[styles.status, { color: kollab.color.ink }]}>{status}</Text>
      <View
        style={[styles.track, { backgroundColor: kollab.color.outline }]}
        onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          setTrackW((prev) => (prev === width ? prev : width));
        }}
      >
        <Animated.View
          style={[styles.bar, { backgroundColor: kollab.color.chartreuse }, barStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  status: {
    fontFamily: font.semiBold,
    fontSize: 13.5,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  track: {
    alignSelf: 'stretch',
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  bar: {
    width: 72,
    height: 4,
    borderRadius: 999,
  },
});
