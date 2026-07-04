import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { appShell, palette, radius } from '@/theme';
import { fonts } from './typography';

interface Props {
  score: number | null;
  grade: string | null;
  size?: 'small' | 'medium' | 'large';
}

function getBadgeColor(grade: string | null): string {
  if (!grade) return appShell.textMuted;
  if (grade === 'A+' || grade === 'A') return appShell.success;
  if (grade === 'B') return appShell.link;
  if (grade === 'C') return appShell.warning;
  return palette.error;
}

export function AuthenticityGradeBadge({ score, grade, size = 'medium' }: Props) {
  const fontSize = size === 'small' ? 10 : size === 'large' ? 16 : 13;
  const paddingHorizontal = size === 'small' ? 6 : size === 'large' ? 10 : 8;
  const paddingVertical = size === 'small' ? 3 : size === 'large' ? 6 : 4;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBadgeColor(grade),
          paddingHorizontal,
          paddingVertical,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{grade ?? '--'}</Text>
      {score !== null && size !== 'small' ? (
        <Text style={[styles.score, { fontSize: Math.max(fontSize - 2, 10) }]}>{score}/100</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.sm,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  text: {
    color: palette.white,
    fontFamily: fonts.bold,
  },
  score: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: fonts.semiBold,
  },
});
