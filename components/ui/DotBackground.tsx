import React, { useId } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';
import { appShell } from '@/theme';

type Props = {
  /** Dot color; defaults to theme dot */
  dotColor?: string;
};

/**
 * Subtle dot-grid canvas (premium reference) — absolute fill behind content.
 */
export function DotBackground({ dotColor = appShell.dot }: Props) {
  const { width, height } = useWindowDimensions();
  const uid = useId().replace(/:/g, '');
  const patternId = `dotGrid_${uid}`;
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  const step = 18;
  const r = 1.25;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={w} height={h}>
        <Defs>
          <Pattern id={patternId} patternUnits="userSpaceOnUse" width={step} height={step}>
            <Circle cx={step / 2} cy={step / 2} r={r} fill={dotColor} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </Svg>
    </View>
  );
}
