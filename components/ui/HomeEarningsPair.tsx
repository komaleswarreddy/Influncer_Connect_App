import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Easing, Animated, type StyleProp, type ViewStyle } from 'react-native';
import { formatInr } from '@/lib/currency';
import { KollabSectionLabel } from './KollabSectionLabel';
import { KollabStatTile } from './KollabStatTile';

type Props = {
  myEarnings: number;
  potentialEarnings: number;
  loading?: boolean;
  onPressMyEarnings: () => void;
  onPressPotential: () => void;
  style?: StyleProp<ViewStyle>;
};

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

/** Earnings Overview — twin stat tiles with count-up, per the Kollab home mock. */
export function HomeEarningsPair({
  myEarnings,
  potentialEarnings,
  loading,
  onPressMyEarnings,
  onPressPotential,
  style,
}: Props) {
  const animate = !loading;
  const paid = useCountUp(myEarnings, animate);
  const pot = useCountUp(potentialEarnings, animate);

  return (
    <View style={style}>
      <KollabSectionLabel label="earnings overview" style={styles.labelPad} />
      <View style={styles.row}>
        <KollabStatTile
          label="My Earnings"
          value={loading ? '…' : formatInr(paid)}
          delta="↑ this month"
          fill="dark"
          onPress={onPressMyEarnings}
          style={styles.tile}
        />
        <KollabStatTile
          label="Potential"
          value={loading ? '…' : formatInr(pot)}
          delta="eligible →"
          fill="tint"
          onPress={onPressPotential}
          style={styles.tile}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelPad: {
    paddingHorizontal: 22,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  tile: {
    flex: 1,
    minWidth: 0,
  },
});
