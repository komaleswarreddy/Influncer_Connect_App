import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { appShell, palette, radius, shadow, spacing } from '@/theme';
import { fonts } from '@/components/ui/typography';
import type { PostMetrics } from '../lib/post-analyzer-api';
import { AuthenticityGradeBadge } from './ui/AuthenticityGradeBadge';
import { getPlatformColor, getPlatformLabel } from '../lib/post-url-parser';

interface Props {
  metrics: PostMetrics;
  onSubmit?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  compact?: boolean;
  showAuthenticitySignals?: boolean;
  /** When false, hides thumbnail/placeholder (e.g. My Stats when art does not load reliably). */
  showThumbnail?: boolean;
  /** When false, hides the Shares metric cell. */
  showShares?: boolean;
}

export function PostMetricsCard({
  metrics,
  onSubmit,
  submitLabel = 'Submit as Proof',
  isSubmitting = false,
  compact = false,
  showAuthenticitySignals = true,
  showThumbnail = true,
  showShares = true,
}: Props) {
  const safeEngagementRate = Number(metrics.engagementRate ?? 0);
  const engagementRateValue = Number.isFinite(safeEngagementRate) ? safeEngagementRate : 0;

  const formatNumber = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  const getErColor = (engagementRate: number): string => {
    if (engagementRate >= 3) return appShell.success;
    if (engagementRate >= 1) return appShell.warning;
    return palette.error;
  };

  const platformColor = getPlatformColor(metrics.platform as Parameters<typeof getPlatformColor>[0]);
  const platformLabel = getPlatformLabel(metrics.platform as Parameters<typeof getPlatformLabel>[0]);

  return (
    <View style={styles.card}>
      <View style={[styles.platformBadge, { backgroundColor: platformColor }]}>
        <Text style={styles.platformText}>{platformLabel}</Text>
      </View>

      <View style={styles.header}>
        {showThumbnail ? (
          metrics.thumbnail ? (
            <Image source={{ uri: metrics.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]} />
          )
        ) : null}
        <View style={styles.creatorInfo}>
          <Text style={styles.creatorName} numberOfLines={1}>
            {metrics.creatorFullName || metrics.creatorUsername}
          </Text>
          <Text style={styles.creatorHandle}>@{metrics.creatorUsername}</Text>
          <Text style={styles.followers}>
            {formatNumber(metrics.creatorFollowers)} followers
            {metrics.creatorIsVerified ? '  ✓' : ''}
          </Text>
        </View>
        <AuthenticityGradeBadge
          score={metrics.authenticityScore ?? null}
          grade={metrics.authenticityGrade ?? null}
          size="medium"
        />
      </View>

      {metrics.title || metrics.caption ? (
        <Text style={styles.caption} numberOfLines={2}>
          {metrics.title || metrics.caption}
        </Text>
      ) : null}

      <View style={styles.metricsGrid}>
        <MetricBox label="Likes" value={formatNumber(metrics.likes)} />
        <MetricBox label="Comments" value={formatNumber(metrics.comments)} />
        {metrics.views !== undefined ? <MetricBox label="Views" value={formatNumber(metrics.views)} /> : null}
        {showShares && metrics.shares !== undefined ? (
          <MetricBox label="Shares" value={formatNumber(metrics.shares)} />
        ) : null}
      </View>

      <View style={styles.erContainer}>
        <Text style={styles.erLabel}>Engagement Rate</Text>
        <Text style={[styles.erValue, { color: getErColor(engagementRateValue) }]}>
          {engagementRateValue.toFixed(2)}%
        </Text>
      </View>

      {!compact && showAuthenticitySignals && metrics.authenticitySignals?.breakdown?.length > 0 ? (
        <View style={styles.breakdown}>
          <Text style={styles.breakdownTitle}>Authenticity Signals</Text>
          {metrics.authenticitySignals.breakdown.map((item, index) => (
            <Text key={`${item}-${index}`} style={styles.breakdownItem}>
              {item}
            </Text>
          ))}
        </View>
      ) : null}

      {onSubmit ? (
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : submitLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appShell.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
    padding: spacing.md,
    marginVertical: spacing.xs,
    ...shadow.cardLight,
  },
  platformBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    marginBottom: spacing.sm,
  },
  platformText: {
    color: palette.white,
    fontSize: 11,
    fontFamily: fonts.semiBold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
  },
  thumbnailPlaceholder: {
    backgroundColor: appShell.canvasAlt,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: appShell.textPrimary,
  },
  creatorHandle: {
    fontSize: 12,
    color: appShell.textSecondary,
    marginTop: 2,
    fontFamily: fonts.regular,
  },
  followers: {
    fontSize: 12,
    color: appShell.textSecondary,
    marginTop: 2,
    fontFamily: fonts.regular,
  },
  caption: {
    fontSize: 13,
    color: appShell.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: appShell.canvasAlt,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricBox: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: appShell.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: appShell.textSecondary,
    marginTop: 2,
    fontFamily: fonts.regular,
  },
  erContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: appShell.borderSubtle,
    marginBottom: spacing.xs,
  },
  erLabel: {
    fontSize: 14,
    color: appShell.textSecondary,
    fontFamily: fonts.semiBold,
  },
  erValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
  },
  breakdown: {
    backgroundColor: appShell.canvasAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  breakdownTitle: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: appShell.textSecondary,
    marginBottom: spacing.xs,
  },
  breakdownItem: {
    fontSize: 12,
    color: appShell.textMuted,
    marginBottom: 3,
    lineHeight: 16,
    fontFamily: fonts.regular,
  },
  submitButton: {
    backgroundColor: appShell.cta,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: {
    backgroundColor: appShell.textMuted,
  },
  submitButtonText: {
    color: palette.white,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
});
