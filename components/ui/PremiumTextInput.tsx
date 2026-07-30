import React from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { radius, spacing, useAppShell } from '@/theme';
import { fonts } from './typography';

type Props = TextInputProps;

export function PremiumTextInput({ style, placeholderTextColor, ...rest }: Props) {
  const shell = useAppShell();
  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: shell.canvasAlt,
          borderColor: shell.borderSubtle,
          color: shell.textPrimary,
        },
        style,
      ]}
      placeholderTextColor={placeholderTextColor ?? shell.textMuted}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
});
