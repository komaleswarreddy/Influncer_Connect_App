import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type TouchableOpacityProps } from 'react-native';
import { radius, useAppShell } from '@/theme';
import { fonts } from './typography';

type Props = TouchableOpacityProps & {
  label: string;
};

export function SecondaryButton({ label, style, ...rest }: Props) {
  const shell = useAppShell();
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.btn, { backgroundColor: shell.secondaryButtonBg }, style]}
      {...rest}
    >
      <Text style={[styles.label, { color: shell.secondaryButtonText }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    fontWeight: '600',
  },
});
