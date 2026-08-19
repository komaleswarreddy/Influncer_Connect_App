import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useKollab } from '@/theme/kollab-tokens';
import type { KollabTokens } from '@/theme/kollab-tokens';

type Props = {
  tone: keyof KollabTokens['statusChip'];
  label: string;
  style?: StyleProp<ViewStyle>;
};

/** Solid-fill status pill — see kollab-tokens.ts's house rule: "no bare outlines" for status chips. */
export function KollabStatusChip({ tone, label, style }: Props) {
  const kollab = useKollab();
  const spec = kollab.statusChip[tone];
  return (
    <View style={[styles.chip, { backgroundColor: spec.bg }, style]}>
      <Text style={[styles.text, { color: spec.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'InstrumentSans_700Bold',
    fontSize: 11.5,
  },
});
