import React from 'react';
import { View, Text, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useKollab, font } from '@/theme/kollab-tokens';

export type GettingStartedItem = {
  key: string;
  title: string;
  done: boolean;
};

type Props = {
  items: GettingStartedItem[];
  style?: StyleProp<ViewStyle>;
};

/**
 * Setup progress — light card matching Home reference: header, slim bar, status chips.
 * Chips are status-only; Quick Setup tiles below are the actions.
 */
export function HomeGettingStartedCard({ items, style }: Props) {
  const kollab = useKollab();
  const c = kollab.color;
  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <View style={[styles.shell, { backgroundColor: c.card, borderColor: c.hairline }, style]}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: c.inkMuted }]}>SETUP PROGRESS</Text>
          <Text style={[styles.title, { color: c.ink }]}>Finish Quick Setup</Text>
          <Text style={[styles.subtitle, { color: c.inkMuted }]}>
            {doneCount} of {total} complete · tap the actions below
          </Text>
        </View>
        <View style={[styles.percentPill, { backgroundColor: c.ink }]}>
          <Text style={[styles.percentText, { color: c.chartreuse }]}>{progress}%</Text>
        </View>
      </View>

      <View style={[styles.track, { backgroundColor: c.hairline }]}>
        <View
          style={[
            styles.fill,
            { width: `${Math.max(progress, 0)}%`, backgroundColor: c.chartreuse },
          ]}
        />
      </View>

      <View style={styles.chips}>
        {items.map((item) => (
          <View
            key={item.key}
            style={[
              styles.chip,
              {
                backgroundColor: item.done ? kollab.statusChip.live.bg : c.neutralChipBg,
                borderColor: item.done ? c.teal : c.hairline,
              },
            ]}
            accessibilityRole="text"
            accessibilityLabel={`${item.title}${item.done ? ', completed' : ', not done'}`}
          >
            <Ionicons
              name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={item.done ? c.teal : c.inkMuted}
            />
            <Text
              style={[styles.chipLabel, { color: item.done ? c.ink : c.inkMuted }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrow: {
    fontFamily: font.semiBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
  },
  percentPill: {
    minWidth: 44,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontFamily: font.bold,
    fontSize: 12,
  },
  /** Same language as HomeCampaignProgressCard. */
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipLabel: {
    fontFamily: font.semiBold,
    fontSize: 12,
  },
});
