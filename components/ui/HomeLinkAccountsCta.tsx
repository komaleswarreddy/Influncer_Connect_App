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
import { useKollab, font } from '@/theme/kollab-tokens';

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Compact premium CTA for linking Instagram / social accounts beside Home shortcuts. */
export function HomeLinkAccountsCta({ onPress, style }: Props) {
  const kollab = useKollab();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Link Account"
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed, style]}
    >
      <LinearGradient
        colors={kollab.fabGradient}
        locations={[0, 1]}
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
        <Text
          style={[styles.title, { color: kollab.color.inkOn }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.9}
        >
          Link Account
        </Text>
        <View style={styles.chevron}>
          <Ionicons name="arrow-forward" size={14} color={kollab.color.chartreuse} />
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
    fontFamily: font.bold,
    fontSize: 15,
    letterSpacing: -0.2,
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
