import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { appShell, premiumNavy, radius, shadow, spacing } from '@/theme';
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
  statusLabel: string;
  statusTone: OpportunityStatusTone;
  commissionRate: string;
  duration: string;
  niche: string;
  audience: string;
  footerBadge?: string | null;
  footerButtonLabel: string;
  onFooterPress: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

type MetricColumnProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function MetricColumn({ icon, label, value }: MetricColumnProps) {
  return (
    <View style={styles.metricColumn}>
      <View style={styles.metricIconWell}>
        <Ionicons name={icon} size={13} color={appShell.cta} />
      </View>
      <Text style={styles.metricLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={styles.metricValue}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {value}
      </Text>
    </View>
  );
}

function MetricDivider() {
  return <View style={styles.metricDivider} />;
}

function CommissionColumn({ rate }: { rate: string }) {
  return (
    <View style={styles.commissionColumn}>
      <Text
        style={styles.commissionValue}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {rate}
      </Text>
      <Text style={styles.commissionLabel} numberOfLines={1}>
        commission
      </Text>
    </View>
  );
}

export function CampaignReferenceCard({
  title,
  brandName,
  metaLine,
  statusLabel,
  statusTone,
  commissionRate,
  duration,
  niche,
  audience,
  footerBadge,
  footerButtonLabel,
  onFooterPress,
  onPress,
  style,
}: CampaignReferenceCardProps) {
  const statusColor = OPPORTUNITY_RAIL[statusTone];

  const content = (
    <View style={[styles.shell, shadow.card, style]}>
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
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {title}
            </Text>
            <View style={[styles.statusPill, { borderColor: CARD_COLORS.statusPillBorder }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={styles.statusPillText} numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <View style={styles.headerMetaBlock}>
            <View style={styles.brandRow}>
              <Ionicons name="business-outline" size={14} color="rgba(255,255,255,0.92)" />
              <Text style={styles.brandText} numberOfLines={1}>
                {brandName}
              </Text>
            </View>
            <Text style={styles.metaLineText} numberOfLines={1}>
              {metaLine}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.metricsRow}>
          <CommissionColumn rate={commissionRate} />
          <MetricDivider />
          <MetricColumn icon="calendar-outline" label="Duration" value={duration} />
          <MetricDivider />
          <MetricColumn icon="pricetag-outline" label="Niche" value={niche} />
          <MetricDivider />
          <MetricColumn icon="people-outline" label="Audience" value={audience} />
        </View>
      </View>

      <View style={styles.footer}>
        {footerBadge ? (
          <View style={styles.footerBadge}>
            <Text style={styles.footerBadgeText} numberOfLines={1}>
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
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

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
  headerBand: {
    minHeight: 118,
    backgroundColor: CARD_COLORS.headerNavy,
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
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
    gap: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.94)',
  },
  metaLineText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.82)',
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
    backgroundColor: CARD_COLORS.commissionBox,
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
    color: appShell.textPrimary,
    textAlign: 'center',
  },
  commissionLabel: {
    width: '100%',
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 11,
    color: appShell.textSecondary,
    textAlign: 'center',
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 56,
    backgroundColor: CARD_COLORS.divider,
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
    backgroundColor: CARD_COLORS.iconWell,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    width: '100%',
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 11,
    color: appShell.textSecondary,
    textAlign: 'center',
  },
  metricValue: {
    width: '100%',
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 12,
    color: appShell.textPrimary,
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
    borderTopColor: CARD_COLORS.divider,
    backgroundColor: appShell.card,
  },
  footerBadge: {
    flexShrink: 0,
    maxWidth: '38%',
    backgroundColor: CARD_COLORS.footerBadgeBg,
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
    color: appShell.cta,
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
