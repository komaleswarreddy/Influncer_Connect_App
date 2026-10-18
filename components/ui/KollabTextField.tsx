import React from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { useKollab } from '@/theme/kollab-tokens';

type Props = TextInputProps & {
  /** Sunken well on a white sheet vs raised card on surface. Default: card. */
  surface?: 'card' | 'well';
};

/** Pill input — 14/18 pad, radius 999, 1.5 outline. HTML form fields. */
export function KollabTextField({
  style,
  placeholderTextColor,
  surface = 'card',
  multiline,
  ...rest
}: Props) {
  const kollab = useKollab();
  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: surface === 'well' ? kollab.color.well : kollab.color.card,
          borderColor: kollab.color.outline,
          color: kollab.color.ink,
          borderRadius: multiline ? kollab.radius.bubble : kollab.radius.pill,
          minHeight: multiline ? 88 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        style,
      ]}
      placeholderTextColor={
        placeholderTextColor ?? (kollab.isDark ? kollab.color.inkMuted : kollab.color.inkFaint)
      }
      multiline={multiline}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 14,
  },
});
