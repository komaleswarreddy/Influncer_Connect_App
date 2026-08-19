import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useKollab } from '@/theme/kollab-tokens';

type Props = {
  label: string;
  /** Rendered between the label and the hairline rule (e.g. an "N active" badge). */
  badge?: React.ReactNode;
  /** Rendered after the hairline rule (e.g. a chevron). */
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Uppercase eyebrow + hairline rule — see kollab-tokens.ts's `type.eyebrow` spec. */
export function KollabSectionLabel({ label, badge, trailing, style }: Props) {
  const kollab = useKollab();
  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.label, { color: kollab.color.ink }]}>{label}</Text>
      {badge}
      <View style={[styles.rule, { backgroundColor: kollab.color.rule }]} />
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  label: {
    fontFamily: 'InstrumentSans_700Bold',
    fontSize: 12,
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    opacity: 0.55,
  },
  rule: {
    flex: 1,
    height: 1,
  },
});
