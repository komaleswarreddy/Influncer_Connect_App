import React from 'react';
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useKollab, font } from '@/theme/kollab-tokens';

type Fill = 'dark' | 'tint' | 'card';

function metricValueFontSize(value: string): number {
  const len = value.length;
  if (len <= 5) return 29;
  if (len <= 7) return 26;
  if (len <= 9) return 23;
  if (len <= 11) return 20;
  return 17;
}

type Props = {
  label: string;
  value: string;
  /** Small line under the value — e.g. "↑ 12.5% this month", "4 eligible →", "across 3 accounts". */
  delta?: string;
  fill?: Fill;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Metric tile — dark/tint/card fill, small label + large display value + optional delta line.
 *  See kollab-tokens.ts's `type.metric` and the "earnings overview" pattern. */
export function KollabStatTile({ label, value, delta, fill = 'card', onPress, style }: Props) {
  const kollab = useKollab();
  const c = kollab.color;

  const bg = fill === 'dark' ? c.panel : fill === 'tint' ? c.tint : c.card;
  const labelColor = fill === 'dark' ? c.panelInk : fill === 'tint' ? c.violetDeep : c.ink;
  const labelOpacity = fill === 'tint' ? 1 : 0.6;
  const valueColor = fill === 'dark' ? c.panelInk : fill === 'tint' ? c.violetDeep : c.ink;
  const deltaColor = fill === 'dark' ? c.chartreuse : fill === 'tint' ? c.violetDeep : c.teal;

  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      style={({ pressed }: { pressed?: boolean }) => [
        styles.tile,
        { backgroundColor: bg },
        pressed && onPress && styles.pressed,
        style,
      ]}
      {...(onPress ? { onPress, accessibilityRole: 'button' as const } : {})}
    >
      <Text style={[styles.label, { color: labelColor, opacity: labelOpacity }]}>{label}</Text>
      <Text
        style={[styles.value, { color: valueColor, fontSize: metricValueFontSize(value) }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.62}
      >
        {value}
      </Text>
      {delta ? (
        <Text style={[styles.delta, { color: deltaColor }]} numberOfLines={1}>
          {delta}
        </Text>
      ) : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 20,
    padding: 17,
    minWidth: 0,
    overflow: 'hidden',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 11.5,
  },
  value: {
    fontFamily: font.display,
    letterSpacing: -1,
    marginTop: 3,
    minWidth: 0,
    flexShrink: 1,
  },
  delta: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 11.5,
    marginTop: 2,
  },
});

export default KollabStatTile;
