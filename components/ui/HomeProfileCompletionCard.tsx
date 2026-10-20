import React from 'react';
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
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
  const dash = (completion.percent / 100) * CIRCUMFERENCE;
  const doneCount = completion.steps.filter((s) => s.done).length;

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        onPress={onPress}
        style={[
          styles.card,
          { backgroundColor: kollab.color.card, borderColor: kollab.color.outline },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Profile ${completion.percent} percent complete. Open profile settings`}
      >
        <View style={styles.ringWrap}>
          <Svg width={RING} height={RING} style={styles.ring}>
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS}
              stroke={kollab.color.outline}
              strokeWidth={STROKE}
              fill="none"
            />
            <Circle
              cx={RING / 2}
              cy={RING / 2}
              r={RADIUS}
              stroke={kollab.color.violetDeep}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
              rotation={-90}
              origin={`${RING / 2}, ${RING / 2}`}
            />
          </Svg>
          <Text style={[styles.percent, { color: kollab.color.ink }]}>{completion.percent}%</Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: kollab.color.ink }]}>Complete your profile</Text>
          <Text style={[styles.sub, { color: kollab.color.inkMuted }]} numberOfLines={2}>
            {doneCount} of {completion.steps.length} done
            {completion.next ? ` · Next: ${completion.next.label}` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={kollab.color.ink} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 22, paddingTop: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  ringWrap: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  percent: { fontFamily: font.bold, fontSize: 13.5 },
  copy: { flex: 1 },
  title: { ...kType.sectionTitle, fontSize: 16, marginBottom: 2 },
  sub: { fontFamily: font.body, fontSize: 12.5, lineHeight: 17 },
});
