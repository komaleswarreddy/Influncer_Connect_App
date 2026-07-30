import React from 'react';
import { View, Text, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { appShell } from '@/theme';
import { fonts } from './typography';

type Props = {
  /** e.g. "Campaign Details" → Campaign / Details */
  title?: string;
  topLine?: string;
  bottomLine?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  align?: 'left' | 'center';
};

export function StackedScreenTitle({
  title,
  topLine,
  bottomLine,
  style,
  textStyle,
  align = 'left',
}: Props) {
  let line1 = topLine;
  let line2 = bottomLine;

  if (title && !line1 && !line2) {
    const parts = title.trim().split(/\s+/);
    if (parts.length >= 2) {
      line2 = parts.pop()!;
      line1 = parts.join(' ');
    } else {
      line1 = title;
    }
  }

  if (!line1) return null;

  return (
    <View style={[styles.wrap, align === 'center' && styles.center, style]}>
      <Text style={[styles.line, textStyle]} numberOfLines={1}>
        {line1}
      </Text>
      {line2 ? (
        <Text style={[styles.line, styles.lineSecondary, textStyle]} numberOfLines={1}>
          {line2}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexShrink: 1,
  },
  center: {
    alignItems: 'center',
  },
  line: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: appShell.cta,
    lineHeight: 20,
  },
  lineSecondary: {
    marginTop: 1,
  },
});
