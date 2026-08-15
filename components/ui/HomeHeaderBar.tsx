import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useHomeDesign, homeFonts } from '@/theme/homeDesign';

type Props = {
  /** Avatar initial. Omit to render the actions row alone (e.g. while loading). */
  avatarLetter?: string | null;
  greeting?: string;
  name?: string | null;
  isDark: boolean;
  hasUnread: boolean;
  onToggleTheme: () => void;
  onPressNotifications: () => void;
};

function SunGlyph({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.9} fill="none" />
      <Path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function MoonGlyph({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path
        d="M12 3a6.5 6.5 0 0 0 9 9 9 9 0 1 1-9-9z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function BellGlyph({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path
        d="M6.5 9a5.5 5.5 0 0 1 11 0c0 6 2.5 7.5 2.5 7.5H4S6.5 15 6.5 9z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M10.3 20a2 2 0 0 0 3.4 0"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Home header — greeting/avatar on the left, theme toggle + bell on the right.
 * The mock's separate "Home" title row is intentionally folded into this row so the
 * greeting occupies that space instead of stacking below it.
 */
export function HomeHeaderBar({
  avatarLetter,
  greeting = 'Welcome !',
  name,
  isDark,
  hasUnread,
  onToggleTheme,
  onPressNotifications,
}: Props) {
  const d = useHomeDesign();
  return (
    <View style={styles.row}>
      {avatarLetter ? (
        <View style={styles.identity}>
          <View style={[styles.mark, { backgroundColor: d.ink }]}>
            <Text style={[styles.markText, { color: d.onInk }]}>{avatarLetter}</Text>
          </View>
          <View style={styles.copy}>
            <Text style={[styles.greeting, { color: d.mut }]} numberOfLines={1}>
              {greeting}
            </Text>
            {name ? (
              // Shrink rather than ellipsize — a truncated name reads worse than a smaller one.
              <Text
                style={[styles.name, { color: d.ink }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {name}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <View style={styles.identity} />
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={onToggleTheme}
          style={({ pressed }) => [
            styles.circle,
            { backgroundColor: d.surf, shadowColor: d.shadowColor, shadowOpacity: d.shadowOpacity },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? <SunGlyph color={d.ink} /> : <MoonGlyph color={d.ink} />}
        </Pressable>
        <Pressable
          onPress={onPressNotifications}
          style={({ pressed }) => [
            styles.circle,
            { backgroundColor: d.ink, shadowColor: d.shadowColor, shadowOpacity: d.shadowOpacity },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <BellGlyph color={d.onInk} />
          {hasUnread ? (
            <View style={[styles.dot, { backgroundColor: d.dot, borderColor: d.ink }]} />
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 48,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  markText: {
    fontFamily: homeFonts.displaySemiBold,
    fontSize: 21,
    letterSpacing: -0.3,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontFamily: homeFonts.semiBold,
    fontSize: 13,
    letterSpacing: -0.1,
  },
  name: {
    fontFamily: homeFonts.displayBold,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.7,
    marginTop: 1,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  actions: {
    flexDirection: 'row',
    gap: 9,
    flexShrink: 0,
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowRadius: 10 },
      android: { elevation: 3 },
      default: {},
    }),
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
});
