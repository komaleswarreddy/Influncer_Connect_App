import { Platform } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const SPRING_OUT = { damping: 14, stiffness: 260 };

const REST_SCALE = 1;
const PRESSED_SCALE = 0.95;
const REST_TRANSLATE_Y = 0;
const PRESSED_TRANSLATE_Y = -8;

const REST_SHADOW = 0.08;
const PRESSED_SHADOW = 0.38;
const REST_ELEVATION = 2;
const PRESSED_ELEVATION = 14;

export type PressLiftHandlers = {
  pressIn: () => void;
  pressOut: () => void;
};

export function usePressLiftStyle(enabled = true) {
  const scale = useSharedValue(REST_SCALE);
  const translateY = useSharedValue(REST_TRANSLATE_Y);
  const elevation = useSharedValue(REST_ELEVATION);
  const shadowOpacity = useSharedValue(REST_SHADOW);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    ...(Platform.OS === 'ios'
      ? {
          shadowOpacity: shadowOpacity.value,
          shadowRadius: 6 + shadowOpacity.value * 18,
          shadowOffset: { width: 0, height: 3 + shadowOpacity.value * 6 },
        }
      : {
          elevation: elevation.value,
        }),
  }));

  const pressIn = () => {
    if (!enabled) return;
    scale.value = withTiming(PRESSED_SCALE, { duration: 110 });
    translateY.value = withTiming(PRESSED_TRANSLATE_Y, { duration: 110 });
    elevation.value = withTiming(PRESSED_ELEVATION, { duration: 110 });
    shadowOpacity.value = withTiming(PRESSED_SHADOW, { duration: 110 });
  };

  const pressOut = () => {
    scale.value = withSpring(REST_SCALE, SPRING_OUT);
    translateY.value = withSpring(REST_TRANSLATE_Y, SPRING_OUT);
    elevation.value = withSpring(REST_ELEVATION, SPRING_OUT);
    shadowOpacity.value = withSpring(REST_SHADOW, SPRING_OUT);
  };

  return { animatedStyle, pressIn, pressOut };
}
