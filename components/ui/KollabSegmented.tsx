import React from 'react';
import { View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useKollab, choiceChipColors } from '@/theme/kollab-tokens';

export type KollabSegment = {
  key: string;
  label: string;
};

type Props = {
  segments: KollabSegment[];
  value: string;
  onChange: (key: string) => void;
  style?: StyleProp<ViewStyle>;
};

/** Ink/canvas pill track — Settings Profile|Password, Inbox Invites|Notifications. */
export function KollabSegmented({ segments, value, onChange, style }: Props) {
  const kollab = useKollab();
  return (
    <View style={[styles.track, { backgroundColor: kollab.color.hairline }, style]}>
      {segments.map((seg) => {
        const active = seg.key === value;
        const chip = choiceChipColors(kollab, active);
        return (
          <Pressable
            key={seg.key}
            onPress={() => onChange(seg.key)}
            style={[
              styles.seg,
              active && {
                backgroundColor: chip.backgroundColor,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={seg.label}
          >
            <Text style={[styles.label, { color: chip.color }]} numberOfLines={1}>
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  seg: {
    flex: 1,
    minWidth: 0,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 13.5,
  },
});
