import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type TouchableOpacityProps } from 'react-native';
import { appShell, radius } from '@/theme';
import { fonts } from './typography';

type Props = TouchableOpacityProps & {
  label: string;
};

export function SecondaryButton({ label, style, ...rest }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.btn, style]}
      {...rest}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: appShell.secondaryButtonBg,
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
    color: appShell.secondaryButtonText,
    fontWeight: '600',
  },
});
