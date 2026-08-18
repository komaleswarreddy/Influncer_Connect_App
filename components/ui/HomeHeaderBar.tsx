import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useKollab, font } from '@/theme/kollab-tokens';

type Props = {
  avatarLetter?: string | null;
  name?: string | null;
  isDark: boolean;
  hasUnread: boolean;
  onToggleTheme: () => void;
  onPressNotifications: () => void;
};

function SunGlyph({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.7} fill="none" />
      <Path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        stroke={color}
        strokeWidth={1.7}
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
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function HomeHeaderBar({
  avatarLetter,
  name,
  isDark,
  hasUnread,
  onToggleTheme,
  onPressNotifications,
}: Props) {
  const kollab = useKollab();
  const c = kollab.color;
  const greeting = name ? `Hi, ${name}` : 'Hi';

  return (
    <View style={styles.row}>
      <View style={[styles.mark, { backgroundColor: c.panel }]}>
        <Text style={[styles.markText, { color: c.chartreuse }]}>{avatarLetter || '•'}</Text>
      </View>
      <Text style={[styles.greeting, { color: c.ink }]} numberOfLines={1}>
        {greeting}
      </Text>
      <Pressable
        onPress={onToggleTheme}
        style={[styles.circle, { backgroundColor: c.card }]}
        accessibilityRole="button"
        accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? <SunGlyph color={c.ink} /> : <MoonGlyph color={c.ink} />}
      </Pressable>
      <Pressable
        onPress={onPressNotifications}
        style={[styles.circle, { backgroundColor: c.card }]}
        accessibilityRole="button"
        accessibilityLabel="Inbox"
      >
        <Svg width={19} height={19} viewBox="0 0 24 24">
          <Path
            d="M12 2a6 6 0 00-6 6v3.6L4 15h16l-2-3.4V8a6 6 0 00-6-6zm0 20a3 3 0 002.8-2H9.2a3 3 0 002.8 2z"
            fill={c.ink}
          />
        </Svg>
        {hasUnread ? (
          <View style={[styles.dot, { backgroundColor: c.violet, borderColor: c.card }]} />
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 4,
  },
  mark: {
    width: 42,
    height: 42,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    fontFamily: font.display,
    fontSize: 19,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  greeting: {
    flex: 1,
    fontFamily: font.semiBold,
    fontSize: 15,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 99,
    borderWidth: 2,
  },
});
