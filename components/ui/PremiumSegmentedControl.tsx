import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { appShell, palette, premiumButton, radius } from '@/theme';
import { fonts } from './typography';

export type PremiumSegmentTone = 'default' | 'danger';

export type PremiumSegment = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  tone?: PremiumSegmentTone;
};

type Props = {
  segments: PremiumSegment[];
  /** Selected key (segments with `tone: 'danger'` are never selected). */
  value: string;
  onChange: (key: string) => void;
  compact?: boolean;
  style?: ViewStyle;
};

function tintIconForActive(icon: React.ReactNode | undefined): React.ReactNode {
  if (!icon) return null;
  if (React.isValidElement(icon)) {
    return React.cloneElement(icon as React.ReactElement<{ color?: string }>, {
      color: premiumButton.labelColor,
    });
  }
  return icon;
}

export function PremiumSegmentedControl({
  segments,
  value,
  onChange,
  compact,
  style,
}: Props) {
  return (
    <View style={[styles.track, style]}>
      {segments.map((seg) => {
        const isDanger = seg.tone === 'danger';
        const active = !isDanger && value === seg.key;

        if (isDanger) {
          return (
            <TouchableOpacity
              key={seg.key}
              style={[styles.segment, compact && styles.segmentCompact, styles.segmentDanger]}
              onPress={() => onChange(seg.key)}
              activeOpacity={0.88}
            >
              <View style={styles.segmentDangerInner}>
                {seg.icon}
                <Text style={styles.labelDanger} numberOfLines={1}>
                  {seg.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={seg.key}
            style={[styles.segment, compact && styles.segmentCompact]}
            onPress={() => onChange(seg.key)}
            activeOpacity={0.92}
          >
            {active ? (
              <LinearGradient
                colors={[...premiumButton.baseGradient]}
                locations={[...premiumButton.baseLocations]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={[styles.segmentFill, compact && styles.segmentFillCompact]}
              >
                <LinearGradient
                  colors={[...premiumButton.glossGradient]}
                  locations={[...premiumButton.glossLocations]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={styles.gloss}
                  pointerEvents="none"
                />
                <View style={styles.rimLine} pointerEvents="none" />
                <View style={styles.segmentContent}>
                  {tintIconForActive(seg.icon)}
                  <Text
                    style={[styles.labelActive, compact && styles.labelActiveCompact]}
                    numberOfLines={2}
                  >
                    {seg.label}
                  </Text>
                </View>
              </LinearGradient>
            ) : (
              <View style={[styles.segmentInactive, compact && styles.segmentInactiveCompact]}>
                <View style={styles.segmentContent}>
                  {seg.icon}
                  <Text
                    style={[styles.labelInactive, compact && styles.labelInactiveCompact]}
                    numberOfLines={2}
                  >
                    {seg.label}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: appShell.card,
    borderRadius: radius.lg,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  segment: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  segmentCompact: {
    borderRadius: radius.sm,
  },
  segmentFill: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  segmentFillCompact: {
    minHeight: 38,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  gloss: {
    ...StyleSheet.absoluteFillObject,
    height: '55%',
  },
  rimLine: {
    position: 'absolute',
    top: 1,
    left: '8%',
    right: '8%',
    height: 1,
    backgroundColor: premiumButton.rimLine,
    opacity: 0.75,
  },
  segmentInactive: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: appShell.canvasAlt,
    borderRadius: radius.md,
  },
  segmentInactiveCompact: {
    minHeight: 38,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  segmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  labelActive: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: premiumButton.labelColor,
    textAlign: 'center',
    flexShrink: 1,
  },
  labelActiveCompact: {
    fontSize: 11,
  },
  labelInactive: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: appShell.textSecondary,
    textAlign: 'center',
    flexShrink: 1,
  },
  labelInactiveCompact: {
    fontSize: 11,
  },
  segmentDanger: {
    flex: 0,
    minWidth: 88,
  },
  segmentDangerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  labelDanger: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: palette.error,
  },
});
