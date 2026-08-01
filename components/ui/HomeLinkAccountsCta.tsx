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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppShell } from '@/theme';
import { fonts } from './typography';

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Compact premium CTA for linking Instagram / social accounts beside Home shortcuts. */
export function HomeLinkAccountsCta({ onPress, style }: Props) {
  const shell = useAppShell();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Link Account"
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed, style]}
    >
      <LinearGradient
        colors={
          shell.isDark ? ['#1A2440', '#121A2E', '#0B1220'] : ['#1A2642', '#141E33', '#0A1018']
        }
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.02)', 'transparent']}
          locations={[0, 0.35, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>
          Link Account
        </Text>
        <View style={styles.chevron}>
          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 56,
    borderRadius: 22,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0A1018',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.bold,
    fontSize: 15,
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  chevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexShrink: 0,
  },
});
