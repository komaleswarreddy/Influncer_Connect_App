import React, { useId } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Pattern,
  Rect,
  Stop,
} from 'react-native-svg';
import { radius, shadow, spacing, useAppShell } from '@/theme';
import { fonts } from '@/components/ui/typography';
import type { MyStatsSummary } from '@/lib/my-stats-dashboard-stats';
import { formatCompactNumber } from '@/lib/my-stats-dashboard-stats';

type Props = {
  summary: MyStatsSummary;
};

const GRADIENT_START = '#8B5CF6';
const GRADIENT_END = '#4F6EF7';

const neumorphicWell = Platform.select({
  ios: {
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  android: { elevation: 3 },
  default: {},
});

function AnalyzerCardDecor() {
  const uid = useId().replace(/:/g, '');
  const dotId = `analyzerDots_${uid}`;
  const waveGradId = `analyzerWave_${uid}`;

  return (
    <View style={styles.decorLayer} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 360 120" preserveAspectRatio="xMaxYMin slice">
        <Defs>
          <Pattern id={dotId} patternUnits="userSpaceOnUse" width={10} height={10}>
            <Circle cx={5} cy={5} r={1.2} fill="rgba(139, 92, 246, 0.12)" />
          </Pattern>
          <SvgLinearGradient id={waveGradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#C4B5FD" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#93C5FD" stopOpacity={0.2} />
          </SvgLinearGradient>
        </Defs>
        <Rect x={220} y={0} width={140} height={90} fill={`url(#${dotId})`} />
        <Circle cx={310} cy={28} r={22} fill="rgba(255, 255, 255, 0.12)" />
        <Circle cx={306} cy={24} r={18} fill="rgba(226, 232, 240, 0.2)" />
        <Path
          d="M 200 70 Q 250 20 300 45 T 360 30"
          stroke={`url(#${waveGradId})`}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M 210 88 Q 265 50 320 62 T 370 48"
          stroke="rgba(167, 139, 250, 0.22)"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

function NeumorphicWell({
  children,
  backgroundColor,
  borderColor,
}: {
  children: React.ReactNode;
  backgroundColor: string;
  borderColor: string;
}) {
  return (
    <View style={[styles.neuWell, { backgroundColor, borderColor }, neumorphicWell]}>
      {children}
    </View>
  );
}

function GradientBarChartIcon() {
  const gradId = useId().replace(/:/g, '');
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Defs>
        <SvgLinearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor={GRADIENT_START} />
          <Stop offset="1" stopColor={GRADIENT_END} />
        </SvgLinearGradient>
      </Defs>
      <Rect x={2} y={9} width={3.5} height={7} rx={1} fill={`url(#${gradId})`} />
      <Rect x={7.25} y={5} width={3.5} height={11} rx={1} fill={`url(#${gradId})`} />
      <Rect x={12.5} y={2} width={3.5} height={14} rx={1} fill={`url(#${gradId})`} />
    </Svg>
  );
}

function GradientPeopleIcon() {
  const gradId = useId().replace(/:/g, '');
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Defs>
        <SvgLinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={GRADIENT_START} />
          <Stop offset="1" stopColor={GRADIENT_END} />
        </SvgLinearGradient>
      </Defs>
      <Circle cx={6.5} cy={5.5} r={2.6} fill={`url(#${gradId})`} />
      <Path
        d="M 2.5 15.5 C 2.5 12.2 4.4 10.5 6.5 10.5 C 8.6 10.5 10.5 12.2 10.5 15.5"
        fill={`url(#${gradId})`}
      />
      <Circle cx={12} cy={6.2} r={2.2} fill={`url(#${gradId})`} />
      <Path
        d="M 9 15.5 C 9 12.8 10.4 11.2 12 11.2 C 13.6 11.2 15 12.8 15 15.5"
        fill={`url(#${gradId})`}
      />
    </Svg>
  );
}

type MetricVariant = 'posts' | 'er' | 'reach';

function MetricIcon({ variant, iconColor }: { variant: MetricVariant; iconColor: string }) {
  if (variant === 'posts') {
    return <Ionicons name="document-text-outline" size={17} color={iconColor} />;
  }
  if (variant === 'er') {
    return <GradientBarChartIcon />;
  }
  return <GradientPeopleIcon />;
}

function MetricColumn({
  variant,
  value,
  label,
  wellBg,
  wellBorder,
  textPrimary,
  textSecondary,
  iconColor,
}: {
  variant: MetricVariant;
  value: string;
  label: string;
  wellBg: string;
  wellBorder: string;
  textPrimary: string;
  textSecondary: string;
  iconColor: string;
}) {
  return (
    <View style={styles.metricCol}>
      <NeumorphicWell backgroundColor={wellBg} borderColor={wellBorder}>
        <MetricIcon variant={variant} iconColor={iconColor} />
      </NeumorphicWell>
      <Text
        style={[styles.metricValue, { color: textPrimary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        {value}
      </Text>
      <Text style={[styles.metricLabel, { color: textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function MyStatsAnalyzerGrid({ summary }: Props) {
  const shell = useAppShell();
  const wellBg = shell.isDark ? shell.canvasAlt : '#FFFFFF';
  const wellBorder = shell.cardBorder;
  const divider = shell.isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB';

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.card,
          shadow.card,
          { backgroundColor: shell.card, borderColor: shell.cardBorder },
        ]}
      >
        <AnalyzerCardDecor />

        <View style={styles.headerRow}>
          <NeumorphicWell backgroundColor={wellBg} borderColor={wellBorder}>
            <Ionicons name="trending-up-outline" size={16} color={shell.cta} />
          </NeumorphicWell>
          <Text style={[styles.sectionTitle, { color: shell.textPrimary }]}>Post analyzer</Text>
        </View>

        <View style={styles.metricsRow}>
          <MetricColumn
            variant="posts"
            value={String(summary.totalPosts)}
            label="Total Posts"
            wellBg={wellBg}
            wellBorder={wellBorder}
            textPrimary={shell.textPrimary}
            textSecondary={shell.textSecondary}
            iconColor={shell.cta}
          />
          <View style={[styles.divider, { backgroundColor: divider }]} />
          <MetricColumn
            variant="er"
            value={`${summary.avgER.toFixed(2)}%`}
            label="Avg ER"
            wellBg={wellBg}
            wellBorder={wellBorder}
            textPrimary={shell.textPrimary}
            textSecondary={shell.textSecondary}
            iconColor={shell.cta}
          />
          <View style={[styles.divider, { backgroundColor: divider }]} />
          <MetricColumn
            variant="reach"
            value={formatCompactNumber(summary.totalReach)}
            label="Total Reach"
            wellBg={wellBg}
            wellBorder={wellBorder}
            textPrimary={shell.textPrimary}
            textSecondary={shell.textSecondary}
            iconColor={shell.cta}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md + 2,
    overflow: 'hidden',
  },
  decorLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '62%',
    height: 100,
    zIndex: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.md,
    zIndex: 1,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.35,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    zIndex: 1,
  },
  metricCol: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  neuWell: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontFamily: fonts.bold,
    fontSize: 19,
    letterSpacing: -0.5,
    width: '100%',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  metricLabel: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 6,
    marginTop: 6,
    marginBottom: 2,
  },
});
