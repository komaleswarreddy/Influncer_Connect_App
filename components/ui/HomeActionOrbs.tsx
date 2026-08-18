import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useKollab, font } from '@/theme/kollab-tokens';

export type HomeActionOrbGlyph =
  'trends' | 'schedule' | 'autoDm' | 'priceCard' | 'rateCalculator' | 'storefront';

export type HomeActionOrb = {
  key: string;
  label: string;
  glyph: HomeActionOrbGlyph;
  onPress: () => void;
};

type Props = {
  actions: HomeActionOrb[];
  style?: StyleProp<ViewStyle>;
};

const STROKE = {
  stroke: '#FFFFFF',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

function Glyph({ glyph, color }: { glyph: HomeActionOrbGlyph; color: string }) {
  const p = { ...STROKE, stroke: color };
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {glyph === 'trends' ? (
        <>
          <Path d="M16 7h6v6" {...p} />
          <Path d="m22 7-8.5 8.5-5-5L2 17" {...p} />
        </>
      ) : glyph === 'schedule' ? (
        <>
          <Rect x={3} y={5} width={18} height={16} rx={3} {...p} />
          <Path d="M8 3v4M16 3v4M3 10h18" {...p} />
        </>
      ) : glyph === 'autoDm' ? (
        <>
          <Path d="M21 14a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...p} />
          <Path d="M8 9h8M8 13h5" {...p} />
        </>
      ) : glyph === 'priceCard' ? (
        <>
          <Rect x={2} y={5} width={20} height={14} rx={3} {...p} />
          <Path d="M2 10h20" {...p} />
        </>
      ) : glyph === 'rateCalculator' ? (
        <>
          <Rect x={4} y={2} width={16} height={20} rx={3} {...p} />
          <Path d="M8 7h8M8 12h2M12 12h2M16 12h.01M8 17h2M12 17h2M16 17h.01" {...p} />
        </>
      ) : (
        <>
          <Path d="M4 7h16l-1.2 12.2a2 2 0 0 1-2 1.8H7.2a2 2 0 0 1-2-1.8z" {...p} />
          <Path d="M9 7a3 3 0 0 1 6 0" {...p} />
          <Circle cx={12} cy={13} r={0.9} fill={color} stroke="none" />
        </>
      )}
    </Svg>
  );
}

function Orb({ action }: { action: HomeActionOrb }) {
  const kollab = useKollab();
  return (
    <Pressable
      onPress={action.onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      accessibilityRole="button"
      accessibilityLabel={action.label}
    >
      <View
        style={[
          styles.orb,
          {
            shadowColor: kollab.shadow.fab.shadowColor,
            shadowOpacity: kollab.shadow.fab.shadowOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={kollab.fabGradient}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Specular sheen across the top third — the mock's --spec layer. */}
        <LinearGradient
          colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)']}
          style={styles.spec}
          pointerEvents="none"
        />
        <Glyph glyph={action.glyph} color={kollab.color.chartreuse} />
      </View>
      <Text style={[styles.label, { color: kollab.color.ink }]} numberOfLines={1}>
        {action.label}
      </Text>
    </Pressable>
  );
}

const PER_ROW = 3;

/**
 * Quick-action orbs — dark gloss circles on a 3-up grid, per the Final Home Screen mock.
 * Wraps into further rows of 3 (new users can have more steps than existing users), and pads
 * the last row with spacers so orbs stay column-aligned instead of centring.
 */
export function HomeActionOrbs({ actions, style }: Props) {
  if (actions.length === 0) return null;

  const rows: HomeActionOrb[][] = [];
  for (let i = 0; i < actions.length; i += PER_ROW) {
    rows.push(actions.slice(i, i + PER_ROW));
  }

  return (
    <View style={[styles.grid, style]}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((a) => (
            <Orb key={a.key} action={a} />
          ))}
          {Array.from({ length: PER_ROW - row.length }).map((_, i) => (
            <View key={`spacer-${i}`} style={styles.item} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 11,
  },
  itemPressed: {
    transform: [{ translateY: 2 }, { scale: 0.94 }],
  },
  orb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 10 }, shadowRadius: 14 },
      android: { elevation: 8 },
      default: {},
    }),
  },
  spec: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    top: '8%',
    height: '28%',
    borderRadius: 20,
  },
  label: {
    fontFamily: font.bold,
    fontSize: 13,
    letterSpacing: -0.2,
  },
});
