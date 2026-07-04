import React from 'react';
import { Platform, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressLiftStyle, type PressLiftHandlers } from './usePressLiftStyle';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  children: React.ReactNode | ((handlers: PressLiftHandlers) => React.ReactNode);
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

export function AnimatedPressCard({ children, onPress, style, disabled }: Props) {
  const enabled = Boolean(onPress) && !disabled;
  const { animatedStyle, pressIn, pressOut } = usePressLiftStyle(enabled);
  const flat = StyleSheet.flatten(style);
  const fillChild = Boolean(flat && (flat.flex === 1 || flat.minHeight === '100%'));

  const handlers: PressLiftHandlers = { pressIn, pressOut };
  const content = typeof children === 'function' ? children(handlers) : children;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled || !onPress}
      style={style}
    >
      <Animated.View style={[styles.card, animatedStyle, fillChild && styles.fill]}>{content}</Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: '#0f172a',
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  fill: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    minHeight: '100%',
  },
});
