import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useHomeDesign, homeFonts } from '@/theme/homeDesign';

type Props = {
  label: string;
  /** Rendered between the label and the hairline rule (e.g. the "3 active" badge). */
  badge?: React.ReactNode;
  /** Rendered after the hairline rule (e.g. a chevron). */
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Uppercase micro label + hairline rule, per the Final Home Screen mock. */
export function HomeSectionLabel({ label, badge, trailing, style }: Props) {
  const d = useHomeDesign();
  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.label, { color: d.mut }]}>{label}</Text>
      {badge}
      <View style={[styles.rule, { backgroundColor: d.line }]} />
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
    fontFamily: homeFonts.bold,
    fontSize: 11,
    letterSpacing: 1.65,
    textTransform: 'uppercase',
  },
  rule: {
    flex: 1,
    height: 1,
  },
});
