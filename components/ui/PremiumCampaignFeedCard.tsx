import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { appShell, premiumNavy, radius, shadow, spacing } from '@/theme';
import { fonts } from './typography';

export type FeedMetaRow = { label: string; value: string };

export type PremiumCampaignFeedCardProps = {
  overline?: string;
  title: string;
  statusLabel: string;
  description?: string;
  /** Key details — full-width stacked rows (label / value) */
  metaRows: FeedMetaRow[];
  metaLayout?: 'stack' | 'columns';
  /** After description, before meta (e.g. rating stars + review) */
  bodyExtra?: React.ReactNode;
  /** CTAs at bottom of card */
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Split premium card: navy gradient header (matches dashboard hero) + light body.
 * Title/status flex rules prevent overflow; meta uses 12–13px and breathing room.
 */
export function PremiumCampaignFeedCard({
  overline,
  title,
  statusLabel,
  description,
  metaRows,
  metaLayout = 'stack',
  bodyExtra,
  footer,
  style,
}: PremiumCampaignFeedCardProps) {
  return (
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
        <LinearGradient
          colors={[...premiumNavy.bottomTint.colors]}
          start={premiumNavy.bottomTint.start}
          end={premiumNavy.bottomTint.end}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            {overline ? (
              <Text style={styles.overline} numberOfLines={1} ellipsizeMode="tail">
                {overline}
              </Text>
            ) : null}
            <Text
              style={styles.headerTitle}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText} numberOfLines={1} ellipsizeMode="tail">
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {description ? (
          <Text style={styles.description} numberOfLines={4}>
            {description}
          </Text>
        ) : null}
        {bodyExtra ? <View style={styles.bodyExtraWrap}>{bodyExtra}</View> : null}

        {metaLayout === 'columns' ? (
          <View style={styles.metaColumnsWrap}>
            {metaRows.slice(0, 3).map((row, i) => (
              <View key={`${row.label}-${i}`} style={styles.metaColumn}>
                <Text style={styles.metaLabel}>{row.label}</Text>
                <Text style={[styles.metaValue, styles.metaValueColumn]} numberOfLines={1} ellipsizeMode="tail">
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          metaRows.map((row, i) => (
            <View
              key={`${row.label}-${i}`}
              style={[styles.metaRow, i === metaRows.length - 1 && styles.metaRowLast]}
            >
              <Text style={styles.metaLabel}>{row.label}</Text>
              <Text style={styles.metaValue} numberOfLines={3}>
                {row.value}
              </Text>
            </View>
          ))
        )}

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(20, 30, 51, 0.1)',
    backgroundColor: appShell.card,
    minHeight: 300,
  },
  headerBand: {
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  overline: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.78)',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.3,
    color: '#FFFFFF',
  },
  statusPill: {
    flexShrink: 0,
    maxWidth: '42%',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  body: {
    backgroundColor: appShell.card,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: appShell.textSecondary,
    marginBottom: spacing.sm,
  },
  bodyExtraWrap: {
    marginBottom: spacing.sm,
  },
  metaColumnsWrap: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appShell.borderSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: appShell.borderSubtle,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  metaColumn: {
    flex: 1,
    paddingHorizontal: 4,
  },
  metaRow: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: appShell.borderSubtle,
  },
  metaRowLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  metaLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: appShell.textMuted,
    marginBottom: 4,
  },
  metaValue: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: appShell.textPrimary,
  },
  metaValueColumn: {
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
