import React from 'react';
import { View, Text, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { appShell, spacing, radius, shadow } from '@/theme';
import { fonts } from './typography';

type Props = {
  activeCollabs: number;
  pendingApprovals: number;
  monthlyGoalProgress: number;
  monthlyGoalPoints: number;
  style?: StyleProp<ViewStyle>;
};

const DECOR_BAR_ACTIVE = 0.72;
const DECOR_BAR_PENDING = 0.48;

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
        <View style={[styles.decorFill, { width: `${barWidth * 100}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

export function HomeCampaignHealthCard({
  activeCollabs,
  pendingApprovals,
  monthlyGoalProgress,
  monthlyGoalPoints,
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
          barWidth={DECOR_BAR_ACTIVE}
          barColor="#4F6EF7"
        />
        <KpiMiniCard
          icon="time-outline"
          iconBg="#64748B"
          value={pendingApprovals}
          label="Pending Approvals"
          barWidth={DECOR_BAR_PENDING}
          barColor="#CBD5E1"
        />
      </View>

      <View style={styles.goalBlock}>
        <View style={styles.goalHeader}>
          <View style={styles.goalIconWell}>
            <MaterialCommunityIcons name="bullseye-arrow" size={20} color={appShell.cta} />
          </View>
          <View style={styles.goalCopy}>
            <Text style={styles.goalTitle}>Monthly Goal</Text>
            <Text style={styles.goalCaption}>
              {monthlyGoalPoints} points at {monthlyGoalProgress}% completion
            </Text>
          </View>
        </View>
        <View style={styles.goalTrack}>
          <View style={[styles.goalFill, { width: `${monthlyGoalProgress}%` }]} />
        </View>
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
    marginBottom: spacing.sm,
  },
  kpiMiniCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: appShell.borderSubtle,
    backgroundColor: '#FAFBFD',
    paddingHorizontal: 10,
    paddingVertical: 10,
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
  goalBlock: {
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: appShell.borderSubtle,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  goalIconWell: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCopy: {
    flex: 1,
    minWidth: 0,
  },
  goalTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: appShell.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  goalCaption: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: appShell.textSecondary,
  },
  goalTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20, 30, 51, 0.08)',
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: appShell.cta,
  },
});
