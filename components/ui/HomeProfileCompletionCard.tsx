import React from 'react';
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';
import type { ProfileCompletion } from '@/lib/profile-completion';

type Props = {
  completion: ProfileCompletion;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

const RING = 56;
const STROKE = 6;
const RADIUS = (RING - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Home nudge: percentage ring + the next missing step; tapping opens Profile settings. Hidden at 100%. */
export function HomeProfileCompletionCard({ completion, onPress, style }: Props) {
  const kollab = useKollab();
  if (completion.percent >= 100) return null;
  const c = kollab.color;
  const dash = (completion.percent / 100) * CIRCUMFERENCE;
  const doneCount = completion.steps.filter((s) => s.done).length;
  const track = 'rgba(245,243,237,0.18)';

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        onPress={onPress}
        style={[styles.card, { backgroundColor: c.panel }]}
        accessibilityRole="button"
        accessibilityLabel={`Profile ${completion.percent} percent complete. Open profile settings`}
      >
        <View style={styles.ringWrap}>
          <Svg width={RING} height={RING} style={styles.ring}>
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS}
              stroke={track}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS}
              stroke={c.chartreuse}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
              rotation={-90}
              origin={`${RING / 2}, ${RING / 2}`}
            />
          </Svg>
          <Text style={[styles.percent, { color: c.inkOn }]}>{completion.percent}%</Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: c.inkOn }]} numberOfLines={1}>
            Complete your profile
          </Text>
          <Text style={[styles.sub, { color: c.inkOn }]} numberOfLines={2}>
            {completion.next ? completion.next.label : 'Almost there'}
          </Text>
        </View>
        <View style={styles.action}>
          <View style={[styles.pill, { backgroundColor: c.chartreuse }]}>
            <Text style={[styles.pillText, { color: c.panel }]}>Continue</Text>
          </View>
          <Text style={[styles.count, { color: c.inkOn }]}>
            {doneCount} of {completion.steps.length} steps done
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 22, paddingTop: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  ringWrap: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  percent: { fontFamily: font.bold, fontSize: 13.5 },
  copy: { flex: 1, minWidth: 0 },
  title: { ...kType.sectionTitle, fontSize: 16, marginBottom: 2 },
  sub: { fontFamily: font.body, fontSize: 12.5, lineHeight: 17, opacity: 0.68 },
  action: { alignItems: 'center', gap: 6 },
  pill: { borderRadius: 99, paddingHorizontal: 18, paddingVertical: 10 },
  pillText: { fontFamily: font.bold, fontSize: 13.5 },
  count: { fontFamily: font.body, fontSize: 10.5, opacity: 0.55 },
});
