import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { spacing, useAppShell } from '@/theme';
import { fonts } from './typography';
import { type HomeModuleIconVariant } from './HomeModuleIconWell';
import { QuickSetupSymbolWell } from './QuickSetupSymbolWell';

export type HomeQuickSetupStep = {
  key: string;
  title: string;
  description: string;
  variant: HomeModuleIconVariant;
  onPress: () => void;
};

type Props = {
  steps: HomeQuickSetupStep[];
  title?: string;
  subtitle?: string | null;
  /** Count-based layouts 1–6. Prefer adaptive. */
  variant?: 'adaptive' | 'setup' | 'actions';
  style?: StyleProp<ViewStyle>;
};

const SPRING = { damping: 18, stiffness: 280 };
const IS_IOS = Platform.OS === 'ios';
const IS_ANDROID = Platform.OS === 'android';
const LAYOUT_TRANSITION = LinearTransition.springify().damping(20).stiffness(240);
const EXIT = FadeOut.duration(220);
const ENTER = FadeIn.duration(220);

type LayoutMode = 'single' | 'row' | 'wrap';

function layoutModeForCount(count: number): LayoutMode {
  if (count <= 1) return 'single';
  if (count === 2 || count === 3) return 'row';
  return 'wrap';
}

function SetupStepItem({
  step,
  iconSize,
  discRatio,
}: {
  step: HomeQuickSetupStep;
  iconSize: number;
  discRatio: number;
}) {
  const shell = useAppShell();
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);
  const shadowLift = useSharedValue(0);

  const animatedWrap = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: lift.value }],
  }));

  const animatedIconShadow = useAnimatedStyle(() => {
    if (IS_IOS) {
      return {
        shadowOpacity: 0.1 + shadowLift.value * 0.08,
        shadowRadius: 10 + shadowLift.value * 6,
        shadowOffset: { width: 0, height: 6 + shadowLift.value * 2 },
      };
    }
    if (IS_ANDROID) {
      return { elevation: 3 + shadowLift.value * 2 };
    }
    return {};
  });

  return (
    <Pressable
      onPress={step.onPress}
      onPressIn={() => {
        scale.value = withTiming(1.03, { duration: 180 });
        lift.value = withTiming(-4, { duration: 180 });
        shadowLift.value = withTiming(1, { duration: 180 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING);
        lift.value = withSpring(0, SPRING);
        shadowLift.value = withSpring(0, SPRING);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${step.title}. ${step.description}`}
      style={styles.stepPressable}
    >
      <Animated.View style={[styles.stepInner, animatedWrap]}>
        <Animated.View style={[styles.iconStage, animatedIconShadow]}>
          <QuickSetupSymbolWell variant={step.variant} size={iconSize} discRatio={discRatio} />
        </Animated.View>
        <Text style={[styles.tileTitle, { color: shell.textPrimary }]} numberOfLines={2}>
          {step.title}
        </Text>
        <Text style={[styles.tileDescription, { color: shell.textSecondary }]} numberOfLines={2}>
          {step.description}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function AnimatedStepCell({
  step,
  iconSize,
  discRatio,
  style,
}: {
  step: HomeQuickSetupStep;
  iconSize: number;
  discRatio: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View style={style} layout={LAYOUT_TRANSITION} entering={ENTER} exiting={EXIT}>
      <SetupStepItem step={step} iconSize={iconSize} discRatio={discRatio} />
    </Animated.View>
  );
}

/**
 * Adaptive Quick Setup / Quick Actions.
 * 1 = centered · 2–3 = equal row · 4–6 = 2-col wrap (never 6-across).
 * Single parent so soft-hide FadeOut + layout keeps working across count changes.
 */
export function HomeQuickSetupSection({
  steps,
  title = 'Quick Actions',
  subtitle = null,
  variant = 'adaptive',
  style,
}: Props) {
  const shell = useAppShell();
  const { width: windowWidth } = useWindowDimensions();
  const count = steps.length;
  const mode =
    variant === 'setup'
      ? 'wrap'
      : variant === 'actions'
        ? count <= 1
          ? 'single'
          : 'row'
        : layoutModeForCount(count);

  const contentWidth = Math.max(0, windowWidth - spacing.lg * 2);
  const rowCellWidth = count > 0 ? Math.floor(contentWidth / Math.max(count, 1)) : contentWidth;

  const iconSize =
    mode === 'wrap' ? 60 : mode === 'row' && count === 3 ? 64 : mode === 'single' ? 64 : 56;
  const discRatio = iconSize >= 60 ? 0.84 : 0.72;

  return (
    <View style={[styles.shell, style]}>
      <Text style={[styles.headerTitle, { color: shell.textPrimary }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.headerSubtitle, { color: shell.textSecondary }]}>{subtitle}</Text>
      ) : null}

      <Animated.View
        style={[
          styles.grid,
          mode === 'single' ? styles.gridSingle : null,
          mode === 'row' ? styles.gridRow : null,
          mode === 'wrap' ? styles.gridWrap : null,
        ]}
        layout={LAYOUT_TRANSITION}
      >
        {steps.map((step, index) => {
          const isLastOddWrap = mode === 'wrap' && count % 2 === 1 && index === count - 1;
          const cellStyle =
            mode === 'single'
              ? styles.singleCell
              : mode === 'row'
                ? ([styles.rowCell, { width: rowCellWidth }] as const)
                : ([styles.wrapCell, isLastOddWrap ? styles.wrapCellCentered : null] as const);

          return (
            <AnimatedStepCell
              key={step.key}
              step={step}
              iconSize={iconSize}
              discRatio={discRatio}
              style={cellStyle}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 2,
    paddingTop: 2,
    paddingBottom: 0,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: -0.45,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  grid: {
    marginTop: 12,
    width: '100%',
  },
  gridSingle: {
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexWrap: 'nowrap',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    rowGap: 14,
  },
  singleCell: {
    width: '100%',
    maxWidth: 200,
    alignItems: 'center',
  },
  rowCell: {
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  wrapCell: {
    width: '50%',
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  /** Centers a lone last tile in a 2-col wrap (e.g. 5th of 5). */
  wrapCellCentered: {
    marginLeft: '25%',
  },
  stepPressable: {
    alignItems: 'center',
    width: '100%',
  },
  stepInner: {
    alignItems: 'center',
    width: '100%',
  },
  iconStage: {
    marginBottom: 10,
    alignItems: 'center',
  },
  tileTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 4,
    width: '100%',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  tileDescription: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    opacity: 0.85,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
});
