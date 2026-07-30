import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { appShell } from '@/theme';
import { fonts } from './typography';
import { QuickSetupSymbolWell } from './QuickSetupSymbolWell';
import type { HomeModuleIconVariant } from './HomeModuleIconWell';

type Action = {
  key: string;
  title: string;
  description: string;
  variant: HomeModuleIconVariant;
  onPress: () => void;
};

type Props = {
  onSchedulePress: () => void;
  onAutoDmPress: () => void;
  style?: StyleProp<ViewStyle>;
};

const ICON_SIZE = 64;
const SPRING = { damping: 18, stiffness: 280 };
const IS_IOS = Platform.OS === 'ios';
const IS_ANDROID = Platform.OS === 'android';

function ActionItem({ action }: { action: Action }) {
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
      onPress={action.onPress}
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
      style={styles.item}
      accessibilityRole="button"
      accessibilityLabel={`${action.title}. ${action.description}`}
    >
      <Animated.View style={[styles.itemInner, animatedWrap]}>
        <Animated.View style={[styles.iconStage, animatedIconShadow]}>
          <QuickSetupSymbolWell variant={action.variant} size={ICON_SIZE} />
        </Animated.View>
        <Text style={styles.title} numberOfLines={1}>
          {action.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {action.description}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/** Schedule Content + Auto DM — same icon language as Quick Actions / Trending Ideas. */
export function HomeCreatorActions({ onSchedulePress, onAutoDmPress, style }: Props) {
  const actions: Action[] = [
    {
      key: 'schedule',
      title: 'Schedule Content',
      description: 'Plan posts for your feed',
      variant: 'schedule',
      onPress: onSchedulePress,
    },
    {
      key: 'auto-dm',
      title: 'Auto DM',
      description: 'Keyword replies that convert',
      variant: 'autoDm',
      onPress: onAutoDmPress,
    },
  ];

  return (
    <View style={[styles.shell, style]}>
      <Text style={styles.headerTitle}>Creator Actions</Text>
      <Text style={styles.headerSubtitle}>Grow with Instagram tools</Text>
      <View style={styles.row}>
        {actions.map((action) => (
          <View key={action.key} style={styles.cell}>
            <ActionItem action={action} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 0,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: -0.45,
    color: appShell.textPrimary,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 17,
    color: appShell.textSecondary,
    opacity: 0.78,
    marginBottom: 14,
    marginTop: 3,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: '50%',
    paddingHorizontal: 5,
  },
  item: {
    alignItems: 'center',
  },
  itemInner: {
    alignItems: 'center',
    width: '100%',
  },
  iconStage: {
    marginBottom: 18,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: -0.2,
    color: appShell.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: appShell.textSecondary,
    opacity: 0.72,
    textAlign: 'center',
    maxWidth: 138,
    minHeight: 30,
  },
});
