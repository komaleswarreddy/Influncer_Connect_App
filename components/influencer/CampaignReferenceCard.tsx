import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Image,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { appShell, premiumNavy, radius, shadow, spacing, useAppShell } from '@/theme';
import { fonts } from '@/components/ui/typography';
import { OPPORTUNITY_RAIL, type OpportunityStatusTone } from '@/lib/opportunity-card-ui';

const CARD_COLORS = {
  headerNavy: '#050C24',
  commissionBox: '#F1F4F9',
  iconWell: '#F1F4F9',
  footerBadgeBg: '#EBEFFF',
  divider: 'rgba(20, 30, 51, 0.08)',
  statusPillBg: 'rgba(255, 255, 255, 0.12)',
  statusPillBorder: 'rgba(255, 255, 255, 0.28)',
} as const;

export type CampaignReferenceCardProps = {
  title: string;
  brandName: string;
  metaLine: string;
  statusLabel?: string | null;
  statusTone?: OpportunityStatusTone;
  commissionRate: string;
  duration: string;
  /** @deprecated Niche lives in metaLine; optional for backwards compatibility. */
  niche?: string;
  brandLogoUrl?: string | null;
  shortDescription?: string | null;
  /** Label under the primary rate (default: commission). */
  rateLabel?: string;
  footerBadge?: string | null;
  footerButtonLabel: string;
  onFooterPress: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Stretch card to fill parent (swipe feed pages) so no dead white gap under metrics. */
  fillHeight?: boolean;
};

type MetricColumnProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  iconColor: string;
  labelColor: string;
  valueColor: string;
  iconWellBg: string;
};

function MetricColumn({
  icon,
  label,
  value,
  iconColor,
  labelColor,
  valueColor,
  iconWellBg,
}: MetricColumnProps) {
  return (
    <View style={styles.metricColumn}>
      <View style={[styles.metricIconWell, { backgroundColor: iconWellBg }]}>
        <Ionicons name={icon} size={13} color={iconColor} />
      </View>
      <Text style={[styles.metricLabel, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[styles.metricValue, { color: valueColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {value}
      </Text>
    </View>
  );
}

function MetricDivider({ color }: { color: string }) {
  return <View style={[styles.metricDivider, { backgroundColor: color }]} />;
}

function CommissionColumn({
  rate,
  label = 'commission',
  boxBg,
  valueColor,
  labelColor,
}: {
  rate: string;
  label?: string;
  boxBg: string;
  valueColor: string;
  labelColor: string;
}) {
  return (
    <View style={[styles.commissionColumn, { backgroundColor: boxBg }]}>
      <Text
        style={[styles.commissionValue, { color: valueColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {rate}
      </Text>
      <Text style={[styles.commissionLabel, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function truncateDescription(text: string, max = 110): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

export const CampaignReferenceCard = React.memo(function CampaignReferenceCard({
  title,
  brandName,
  metaLine,
  statusLabel,
  statusTone,
  commissionRate,
  duration,
  brandLogoUrl,
  shortDescription,
  rateLabel = 'commission',
  footerBadge,
  footerButtonLabel,
  onFooterPress,
  onPress,
  style,
  fillHeight = false,
}: CampaignReferenceCardProps) {
  const shell = useAppShell();
  const statusColor = statusTone ? OPPORTUNITY_RAIL[statusTone] : OPPORTUNITY_RAIL.open;
  const showStatusPill = Boolean(statusLabel && String(statusLabel).trim());
  const desc =
    shortDescription && shortDescription.trim() ? truncateDescription(shortDescription) : null;

  const metricsSurface = shell.isDark ? 'rgba(255,255,255,0.10)' : CARD_COLORS.commissionBox;
  const metricsIconWell = shell.isDark ? 'rgba(255,255,255,0.12)' : CARD_COLORS.iconWell;
  const metricsAccent = shell.isDark ? '#E8ECFF' : shell.cta;
  const footerBadgeBg = shell.isDark ? 'rgba(142, 158, 237, 0.22)' : CARD_COLORS.footerBadgeBg;

  const content = (
    <View
      style={[
        styles.shell,
        fillHeight && styles.shellFill,
        shadow.card,
        { backgroundColor: shell.card, borderColor: shell.cardBorder },
        style,
      ]}
    >
      <View style={[styles.headerBand, fillHeight && styles.headerBandFill]}>
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

        <View style={[styles.headerContent, fillHeight && styles.headerContentFill]}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {title}
            </Text>
            {showStatusPill ? (
              <View style={[styles.statusPill, { borderColor: CARD_COLORS.statusPillBorder }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={styles.statusPillText} numberOfLines={1}>
                  {statusLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.headerMetaBlock}>
            <View style={styles.brandRow}>
              {brandLogoUrl ? (
                <View style={styles.brandLogoWell}>
                  <Image
                    source={{ uri: brandLogoUrl }}
                    style={styles.brandLogo}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={styles.brandLogoFallback}>
                  <Ionicons name="business-outline" size={20} color="rgba(255,255,255,0.92)" />
                </View>
              )}
              <View style={styles.brandCopy}>
                <Text style={styles.brandText} numberOfLines={1}>
                  {brandName}
                </Text>
                <Text style={styles.metaLineText} numberOfLines={1}>
                  {metaLine}
                </Text>
              </View>
            </View>
            {desc ? (
              <Text style={styles.shortDescription} numberOfLines={2}>
                {desc}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={[styles.body, { backgroundColor: shell.card }]}>
        <View style={styles.metricsRow}>
          <CommissionColumn
            rate={commissionRate}
            label={rateLabel}
            boxBg={metricsSurface}
            valueColor={shell.textPrimary}
            labelColor={shell.textSecondary}
          />
          <MetricDivider color={shell.cardBorder} />
          <MetricColumn
            icon="calendar-outline"
            label="Duration"
            value={duration}
            iconColor={metricsAccent}
            labelColor={shell.textSecondary}
            valueColor={shell.textPrimary}
            iconWellBg={metricsIconWell}
          />
        </View>
      </View>

      <View
        style={[styles.footer, { backgroundColor: shell.card, borderTopColor: shell.cardBorder }]}
      >
        {footerBadge ? (
          <View style={[styles.footerBadge, { backgroundColor: footerBadgeBg }]}>
            <Text style={[styles.footerBadgeText, { color: shell.cta }]} numberOfLines={1}>
              {footerBadge}
            </Text>
          </View>
        ) : (
          <View style={styles.footerBadgeSpacer} />
        )}

        <Pressable
          accessibilityRole="button"
          onPress={onFooterPress}
          style={({ pressed }) => [styles.footerButton, pressed && styles.footerButtonPressed]}
        >
          <LinearGradient
            colors={['#1a2642', '#141e33', '#0a1018']}
            locations={[0, 0.45, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.footerButtonGradient}
          >
            <Text style={styles.footerButtonLabel} numberOfLines={1}>
              {footerButtonLabel}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={fillHeight ? styles.pressableFill : undefined}
    >
      {content}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: appShell.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_COLORS.divider,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  shellFill: {
    flex: 1,
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  pressableFill: {
    flex: 1,
    width: '100%',
  },
  headerBand: {
    minHeight: 132,
    backgroundColor: CARD_COLORS.headerNavy,
    overflow: 'hidden',
  },
  headerBandFill: {
    flex: 1,
  },
  headerContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerContentFill: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  statusPill: {
    flexShrink: 0,
    maxWidth: '42%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: CARD_COLORS.statusPillBg,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusPillText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  headerMetaBlock: {
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLogoWell: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },
  brandLogoFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  brandText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.96)',
  },
  metaLineText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.78)',
  },
  shortDescription: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.76)',
  },
  body: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: appShell.card,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 84,
  },
  commissionColumn: {
    flex: 1.05,
    minWidth: 0,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: spacing.sm,
    gap: 2,
    height: 76,
  },
  commissionValue: {
    width: '100%',
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  commissionLabel: {
    width: '100%',
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'center',
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 56,
    marginHorizontal: 4,
  },
  metricColumn: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 76,
    paddingHorizontal: 2,
  },
  metricIconWell: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    width: '100%',
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
  },
  metricValue: {
    width: '100%',
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBadge: {
    flexShrink: 0,
    maxWidth: '38%',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  footerBadgeSpacer: {
    width: 0,
  },
  footerBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  footerButton: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  footerButtonPressed: {
    opacity: 0.92,
  },
  footerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  footerButtonLabel: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 16,
    color: '#FFFFFF',
  },
});
