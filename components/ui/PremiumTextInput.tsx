import React from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { appShell, radius, spacing } from '@/theme';
import { fonts } from './typography';

type Props = TextInputProps;

export function PremiumTextInput({ style, placeholderTextColor, ...rest }: Props) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor={placeholderTextColor ?? appShell.textMuted}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: appShell.canvasAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: appShell.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
});
