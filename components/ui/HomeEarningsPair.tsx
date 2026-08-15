import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Easing,
  Animated,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useHomeDesign, homeFonts, type HomeDesignTokens } from '@/theme/homeDesign';
import { HomeSectionLabel } from './HomeSectionLabel';

type Props = {
  myEarnings: number;
  potentialEarnings: number;
  loading?: boolean;
  onPressMyEarnings: () => void;
  onPressPotential: () => void;
  style?: StyleProp<ViewStyle>;
};

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

/** Counts up to `value` over 1300ms with a cubic ease-out, matching the mock's rAF ramp. */
function useCountUp(value: number, enabled: boolean) {
  const [shown, setShown] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  const target = useRef(value);
  target.current = value;

  useEffect(() => {
    if (!enabled) return;
    const id = anim.addListener(({ value: k }) => setShown(target.current * k));
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 1300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [anim, enabled, value]);

  return enabled ? shown : value;
}

function TrendGlyph({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M16 7h6v6"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="m22 7-8.5 8.5-5-5L2 17"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function EarningsCard({
  d,
  gradient,
  borderColor,
  hairColor,
  labelNode,
  value,
  hint,
  hintColor,
  hintOpacity,
  onPress,
}: {
  d: HomeDesignTokens;
  gradient: readonly [string, string, string];
  borderColor: string;
  hairColor: string;
  labelNode: React.ReactNode;
  value: string;
  hint: string;
  hintColor: string;
  hintOpacity?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderColor, shadowColor: d.shadowColor, shadowOpacity: d.shadowOpacity },
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${value}. ${hint}`}
    >
      <LinearGradient colors={gradient} locations={[0, 0.48, 1]} style={StyleSheet.absoluteFill} />
      {labelNode}
      <Text
        style={[styles.value, { color: d.ink }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {value}
      </Text>
      <View style={[styles.hair, { backgroundColor: hairColor }]} />
      <Text style={[styles.hint, { color: hintColor, opacity: hintOpacity ?? 1 }]}>{hint}</Text>
    </Pressable>
  );
}

/** Earnings Overview — twin gradient cards with count-up, per the Final Home Screen mock. */
export function HomeEarningsPair({
  myEarnings,
  potentialEarnings,
  loading,
  onPressMyEarnings,
  onPressPotential,
  style,
}: Props) {
  const d = useHomeDesign();
  const animate = !loading;
  const paid = useCountUp(myEarnings, animate);
  const pot = useCountUp(potentialEarnings, animate);

  return (
    <View style={style}>
      <HomeSectionLabel label="Earnings Overview" />
      <View style={styles.row}>
        <EarningsCard
          d={d}
          gradient={d.cardA}
          borderColor={d.line}
          hairColor={d.hair}
          labelNode={<Text style={[styles.label, { color: d.mut }]}>My Earnings</Text>}
          value={loading ? '…' : inr(paid)}
          hint="paid to date"
          hintColor={d.mut}
          onPress={onPressMyEarnings}
        />
        <EarningsCard
          d={d}
          gradient={d.cardB}
          borderColor={d.washLine}
          hairColor={d.hairB}
          labelNode={
            <View style={styles.labelRow}>
              <TrendGlyph color={d.ink} size={12} />
              <Text style={[styles.label, { color: d.ink }]}>Potential</Text>
            </View>
          }
          value={loading ? '…' : inr(pot)}
          hint="fixed pay · eligible campaigns"
          hintColor={d.ink}
          hintOpacity={0.7}
          onPress={onPressPotential}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  card: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 14,
    gap: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowRadius: 10 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  cardPressed: {
    transform: [{ scale: 0.975 }],
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontFamily: homeFonts.semiBold,
    fontSize: 11.5,
    letterSpacing: 0.23,
  },
  value: {
    fontFamily: homeFonts.displaySemiBold,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1.4,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  hair: {
    height: 1,
    marginTop: 2,
    marginBottom: 1,
  },
  hint: {
    fontFamily: homeFonts.regular,
    fontSize: 11.5,
    lineHeight: 15,
  },
});
