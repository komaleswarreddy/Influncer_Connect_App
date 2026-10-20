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
        <View style={styles.top}>
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
            <Text style={[styles.title, { color: c.inkOn }]}>Complete your profile</Text>
            <Text style={[styles.sub, { color: c.inkOn }]} numberOfLines={2}>
              {completion.next
                ? completion.next.label
                : `${doneCount} of ${completion.steps.length} done`}
            </Text>
          </View>
        </View>
        <View style={styles.bottom}>
          <View style={styles.segments}>
            {completion.steps.map((step) => (
              <View
                key={step.key}
                style={[styles.segment, { backgroundColor: step.done ? c.chartreuse : track }]}
              />
            ))}
          </View>
          <View style={[styles.pill, { backgroundColor: c.chartreuse }]}>
            <Text style={[styles.pillText, { color: c.panel }]}>Continue</Text>
          </View>
        </View>
        <Text style={[styles.count, { color: c.inkOn }]}>
          {doneCount} of {completion.steps.length} steps done
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 22, paddingTop: 12 },
  card: { borderRadius: 26, padding: 18, gap: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ringWrap: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  percent: { fontFamily: font.bold, fontSize: 13.5 },
  copy: { flex: 1 },
  title: { ...kType.sectionTitle, fontSize: 17, marginBottom: 3 },
  sub: { fontFamily: font.body, fontSize: 13, lineHeight: 18, opacity: 0.72 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  segments: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: 99 },
  pill: { borderRadius: 99, paddingHorizontal: 18, paddingVertical: 10 },
  pillText: { fontFamily: font.bold, fontSize: 13.5 },
  count: { fontFamily: font.body, fontSize: 11.5, opacity: 0.55, marginTop: -6 },
});
