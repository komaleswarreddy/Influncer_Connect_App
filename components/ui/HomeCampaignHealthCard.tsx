import React from 'react';
import { View, Text, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appShell, spacing, radius, shadow } from '@/theme';
import { fonts } from './typography';

type Props = {
  activeCollabs: number;
  pendingApprovals: number;
  /** 0–1 share of tracked collabs that are active */
  activeRatio: number;
  /** 0–1 share of tracked collabs that are pending */
  pendingRatio: number;
  style?: StyleProp<ViewStyle>;
};

function clampRatio(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

function KpiMiniCard({
  icon,
  iconBg,
  value,
  label,
  barWidth,
  barColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  value: number;
  label: string;
  barWidth: number;
  barColor: string;
}) {
  const widthPct = `${Math.round(clampRatio(barWidth) * 100)}%` as `${number}%`;
  return (
    <View style={styles.kpiMiniCard}>
      <View style={styles.kpiTopRow}>
        <View style={[styles.kpiIconWell, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.kpiValue}>{value}</Text>
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <View style={styles.decorTrack}>
        <View style={[styles.decorFill, { width: widthPct, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

export function HomeCampaignHealthCard({
  activeCollabs,
  pendingApprovals,
  activeRatio,
  pendingRatio,
  style,
}: Props) {
  return (
    <View style={[styles.card, shadow.card, style]}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.cardTitle}>Campaign Health</Text>
          <Text style={styles.cardSubtitle}>Performance snapshot</Text>
        </View>
        <View style={styles.chartIconWell}>
          <Ionicons name="stats-chart-outline" size={16} color={appShell.textSecondary} />
        </View>
      </View>

      <View style={styles.kpiRow}>
        <KpiMiniCard
          icon="people-outline"
          iconBg="#4F6EF7"
          value={activeCollabs}
          label="Active Collabs"
          barWidth={activeRatio}
          barColor="#4F6EF7"
        />
        <KpiMiniCard
          icon="time-outline"
          iconBg="#64748B"
          value={pendingApprovals}
          label="Pending Approvals"
          barWidth={pendingRatio}
          barColor="#94A3B8"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: appShell.card,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.cardBorder,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerCopy: { flex: 1, minWidth: 0, paddingRight: spacing.sm },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: -0.4,
    lineHeight: 26,
    color: appShell.textPrimary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: appShell.textSecondary,
  },
  chartIconWell: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.borderSubtle,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiMiniCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.borderSubtle,
    backgroundColor: '#FAFBFD',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  kpiIconWell: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: -0.6,
    color: appShell.textPrimary,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  kpiLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: appShell.textSecondary,
    marginBottom: 8,
  },
  decorTrack: {
    width: '100%',
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20, 30, 51, 0.06)',
    overflow: 'hidden',
  },
  decorFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
