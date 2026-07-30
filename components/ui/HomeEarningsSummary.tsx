import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppShell } from '@/theme';
import { fonts } from './typography';
import { formatHomeInr } from '@/lib/home-potential-earnings';

type Props = {
  myEarnings: number;
  potentialEarnings: number;
  loading?: boolean;
  onPressMyEarnings: () => void;
  onPressPotential: () => void;
  style?: StyleProp<ViewStyle>;
};

type KpiColors = {
  label: string;
  value: string;
  cardBg: string;
  iconWell: string;
};

/** Scale amount text so ₹10,000+ fits beside the icon well in half-width cards. */
function earningsValueFontSize(value: string): number {
  const len = value.length;
  if (len <= 3) return 22;
  if (len <= 6) return 20;
  if (len <= 8) return 18;
  if (len <= 10) return 16;
  return 14;
}

function EarningsKpiCard({
  label,
  value,
  hint,
  colors,
  hintColor,
  iconName,
  onPress,
}: {
  label: string;
  value: string;
  hint: string;
  colors: KpiColors;
  hintColor: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.kpiCard, { backgroundColor: colors.cardBg }]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. ${hint}`}
    >
      <Text style={[styles.kpiLabel, { color: colors.label }]} numberOfLines={2}>
        {label}
      </Text>
      <View style={styles.kpiValueRow}>
        <Text
          style={[styles.kpiValue, { color: colors.value, fontSize: earningsValueFontSize(value) }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {value}
        </Text>
        <View style={[styles.kpiIconWell, { backgroundColor: colors.iconWell }]}>
          <Ionicons name={iconName} size={18} color={colors.value} />
        </View>
      </View>
      <Text style={[styles.kpiHint, { color: hintColor }]} numberOfLines={2}>
        {hint}
      </Text>
    </Pressable>
  );
}

/** Earnings Overview — dual KPI cards. */
export function HomeEarningsSummary({
  myEarnings,
  potentialEarnings,
  loading,
  onPressMyEarnings,
  onPressPotential,
  style,
}: Props) {
  const shell = useAppShell();
  const myLabel = loading ? '…' : formatHomeInr(myEarnings);
  const potLabel = loading ? '…' : formatHomeInr(potentialEarnings);

  const purple: KpiColors = shell.isDark
    ? {
        label: '#C4B5FD',
        value: '#C4B5FD',
        cardBg: 'rgba(124, 92, 255, 0.18)',
        iconWell: 'rgba(124, 92, 255, 0.32)',
      }
    : {
        label: '#7C5CFF',
        value: '#7C5CFF',
        cardBg: '#F4F0FF',
        iconWell: '#E8E2FF',
      };

  const mint: KpiColors = shell.isDark
    ? {
        label: '#5EEAD4',
        value: '#5EEAD4',
        cardBg: 'rgba(20, 184, 166, 0.16)',
        iconWell: 'rgba(20, 184, 166, 0.28)',
      }
    : {
        label: '#14B8A6',
        value: '#14B8A6',
        cardBg: '#ECFAF5',
        iconWell: '#C8F5EA',
      };

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: shell.card,
          borderColor: shell.cardBorder,
        },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: shell.textPrimary }]}>Earnings Overview</Text>
      </View>

      <View style={styles.cardsRow}>
        <EarningsKpiCard
          label="MY EARNINGS"
          value={myLabel}
          hint="Paid across campaigns to date"
          colors={purple}
          hintColor={shell.textSecondary}
          iconName="wallet-outline"
          onPress={onPressMyEarnings}
        />
        <EarningsKpiCard
          label="POTENTIAL EARNINGS"
          value={potLabel}
          hint="Fixed pay from eligible campaigns"
          colors={mint}
          hintColor={shell.textSecondary}
          iconName="trending-up-outline"
          onPress={onPressPotential}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.35,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 11,
    gap: 6,
    minWidth: 0,
  },
  kpiLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
    lineHeight: 12,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    minHeight: 36,
  },
  kpiValue: {
    flex: 1,
    fontFamily: fonts.bold,
    letterSpacing: -0.5,
    minWidth: 0,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  kpiIconWell: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});
