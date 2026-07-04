import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { appShell, premiumNavy, radius, shadow, spacing } from '@/theme';
import { fonts } from './typography';
import { GlassSocialIcon, type GlassSocialPlatform } from './GlassSocialIcon';
import {
  OPPORTUNITY_RAIL,
  type OpportunityStatusTone,
} from '@/lib/opportunity-card-ui';

export type OpportunityPlatform = GlassSocialPlatform | 'ugc';

export type OpportunityDetailRow = {
  label: string;
  value: string;
};

export type PremiumOpportunityCardProps = {
  title: string;
  /** e.g. "Acmewwq · Direct booking" */
  subtitle: string;
  statusLabel: string;
  statusTone: OpportunityStatusTone;
  amountPrimary: string;
  amountSecondary?: string;
  platform?: OpportunityPlatform;
  quote?: string;
  quoteLabel?: string;
  onPress?: () => void;
  footer?: React.ReactNode;
  highlighted?: boolean;
  showChevron?: boolean;
  /** Swipe feed: stretch card to parent minHeight and pin footer to bottom */
  fillHeight?: boolean;
  detailRows?: OpportunityDetailRow[];
  style?: StyleProp<ViewStyle>;
};

function PlatformBadge({ platform, size = 28 }: { platform: OpportunityPlatform; size?: number }) {
  if (platform === 'ugc') {
    return (
      <View style={[styles.ugcBadge, { width: size, height: size, borderRadius: size * 0.32 }]}>
        <Ionicons name="videocam" size={size * 0.48} color="#fff" />
      </View>
    );
  }
  return <GlassSocialIcon platform={platform} size={size} />;
}

export function PremiumOpportunityCard({
  title,
  subtitle,
  statusLabel,
  statusTone,
  amountPrimary,
  amountSecondary,
  platform,
  quote,
  quoteLabel,
  onPress,
  footer,
  highlighted,
  showChevron = true,
  fillHeight = false,
  detailRows,
  style,
}: PremiumOpportunityCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (!onPress) return;
    Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };

  const railColor = OPPORTUNITY_RAIL[statusTone];
  const pillBg = statusTone === 'success' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.14)';
  const pillBorder = 'rgba(255, 255, 255, 0.35)';

  const inner = (
    <View
      style={[
        styles.shell,
        shadow.cardLight,
        { borderLeftColor: railColor },
        highlighted && styles.shellHighlighted,
        fillHeight && styles.shellFillHeight,
        style,
      ]}
    >
      <View style={styles.headerBand}>
        <LinearGradient
          colors={[...premiumNavy.base.colors]}
          locations={[...premiumNavy.base.locations]}
          start={premiumNavy.base.start}
          end={premiumNavy.base.end}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[...premiumNavy.sheen.colors]}
          locations={[...premiumNavy.sheen.locations]}
          start={premiumNavy.sheen.start}
          end={premiumNavy.sheen.end}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.identityRow}>
              {platform ? <PlatformBadge platform={platform} size={26} /> : null}
              <View style={styles.titleBlock}>
                <Text style={styles.headerTitle} numberOfLines={2}>
                  {title}
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              </View>
            </View>
            <View style={[styles.statusPill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
              <View style={[styles.statusDot, { backgroundColor: railColor }]} />
              <Text style={styles.statusPillText} numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.body, fillHeight && styles.bodyFillHeight]}>
        <View style={fillHeight ? styles.bodyMain : undefined}>
          <View style={styles.amountRow}>
            <View style={styles.amountBlock}>
              <Text style={styles.amountPrimary}>{amountPrimary}</Text>
              {amountSecondary ? (
                <Text style={styles.amountSecondary}>{amountSecondary}</Text>
              ) : null}
            </View>
            {showChevron && onPress ? (
              <View style={styles.chevronWrap}>
                <Ionicons name="chevron-forward" size={18} color={appShell.textMuted} />
              </View>
            ) : null}
          </View>

          {detailRows && detailRows.length > 0 ? (
            <View style={styles.detailRows}>
              {detailRows.map((row) => (
                <View key={row.label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {quote ? (
            <View style={styles.quoteBlock}>
              {quoteLabel ? <Text style={styles.quoteLabel}>{quoteLabel}</Text> : null}
              <Text style={styles.quoteText} numberOfLines={3}>
                {quote}
              </Text>
            </View>
          ) : null}
        </View>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </View>
  );

  if (!onPress) {
    return (
      <View style={[fillHeight && styles.fillWrap, style]}>
        {inner}
      </View>
    );
  }

  return (
    <Animated.View style={[fillHeight && styles.fillWrap, { marginBottom: spacing.sm, transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
      >
        {inner}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: appShell.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20, 30, 51, 0.1)',
    borderLeftWidth: 4,
  },
  shellHighlighted: {
    borderColor: appShell.cta,
    borderLeftWidth: 4,
  },
  shellFillHeight: {
    flex: 1,
    minHeight: '100%',
    alignSelf: 'stretch',
  },
  headerBand: {
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  identityRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  ugcBadge: {
    backgroundColor: '#4F6EF7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.3,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 2,
  },
  statusPill: {
    flexShrink: 0,
    maxWidth: '38%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: '#FFFFFF',
    flexShrink: 1,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: appShell.card,
  },
  bodyFillHeight: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bodyMain: {
    flex: 1,
    gap: spacing.sm,
  },
  detailRows: {
    marginTop: spacing.xs,
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appShell.borderSubtle,
  },
  detailRow: {
    gap: 2,
  },
  detailLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: appShell.textMuted,
  },
  detailValue: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: appShell.textPrimary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  amountPrimary: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: appShell.textPrimary,
  },
  amountSecondary: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: appShell.textSecondary,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: appShell.iceBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteBlock: {
    marginTop: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: appShell.accent,
    backgroundColor: appShell.iceBlue,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  quoteLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: appShell.textMuted,
    marginBottom: 2,
  },
  quoteText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    color: appShell.textSecondary,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appShell.borderSubtle,
  },
  fillWrap: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    minHeight: '100%',
  },
});
