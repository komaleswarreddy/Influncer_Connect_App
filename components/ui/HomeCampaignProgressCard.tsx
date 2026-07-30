import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore } from '@/store/progress-store';
import { useAppShell, appShellLight as appShell } from '@/theme';
import { fonts } from './typography';
import { PrimaryButton } from './PrimaryButton';

export type HomeCampaignProgressItem = {
  participationId: string;
  campaignId: string;
  campaignName: string;
};

type Props = {
  /** Active participations — first is primary (shown), rest appear under Show remaining. */
  items: HomeCampaignProgressItem[];
  onPress: (campaignId: string, participationId: string) => void;
  style?: StyleProp<ViewStyle>;
};

type RequirementItem = {
  id: string;
  label: string;
  completedCount: number;
  requiredCount: number;
  isCompleted: boolean;
  statusLabel: 'Done' | 'In progress' | 'Pending';
};

function formatContentType(raw: string): string {
  return String(raw || 'Deliverable')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function deriveStatus(item: {
  isCompleted: boolean;
  completedCount: number;
  requiredCount: number;
}): RequirementItem['statusLabel'] {
  if (item.isCompleted || (item.requiredCount > 0 && item.completedCount >= item.requiredCount)) {
    return 'Done';
  }
  if (item.completedCount > 0) return 'In progress';
  return 'Pending';
}

function RequirementRow({ item }: { item: RequirementItem }) {
  const shell = useAppShell();
  const isDone = item.statusLabel === 'Done';
  const isProgress = item.statusLabel === 'In progress';

  return (
    <View
      style={[
        styles.reqRow,
        { backgroundColor: shell.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20, 30, 51, 0.04)' },
      ]}
    >
      <View style={styles.reqCopy}>
        <Text style={[styles.reqTitle, { color: shell.textPrimary }]} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={[styles.reqMeta, { color: shell.textSecondary }]}>
          {item.completedCount} of {item.requiredCount}
        </Text>
      </View>
      <View
        style={[
          styles.chip,
          isDone
            ? { backgroundColor: 'rgba(34, 199, 168, 0.2)' }
            : isProgress
              ? { backgroundColor: shell.iceBlue }
              : {
                  backgroundColor: shell.isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(20, 30, 51, 0.1)',
                },
        ]}
      >
        <Text
          style={[
            styles.chipText,
            {
              color: isDone ? shell.success : isProgress ? shell.cta : shell.textSecondary,
            },
          ]}
        >
          {item.statusLabel}
        </Text>
      </View>
    </View>
  );
}

function OtherCampaignRow({
  name,
  percentage,
  meta,
  onPress,
}: {
  name: string;
  percentage: number;
  meta: string;
  onPress: () => void;
}) {
  const shell = useAppShell();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.otherRow, { borderColor: shell.cardBorder, backgroundColor: shell.canvasAlt }]}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${Math.round(percentage)} percent. ${meta}`}
    >
      <View style={styles.otherCopy}>
        <Text style={[styles.otherName, { color: shell.textPrimary }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.otherMeta, { color: shell.textSecondary }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <View style={[styles.otherPercent, { backgroundColor: shell.iceBlue }]}>
        <Text style={[styles.otherPercentText, { color: shell.cta }]}>
          {Math.round(percentage)}%
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={shell.cta} />
    </Pressable>
  );
}

/** Compact campaign progress — primary campaign + expandable remaining campaigns. */
export function HomeCampaignProgressCard({ items, onPress, style }: Props) {
  const shell = useAppShell();
  const [showRemaining, setShowRemaining] = useState(false);
  const [remainingLoading, setRemainingLoading] = useState(false);
  const fetchProgress = useProgressStore((s) => s.fetchProgress);
  const isLoading = useProgressStore((s) => s.isLoading);
  const progressData = useProgressStore((s) => s.progressData);

  const primary = items[0] ?? null;
  const remaining = useMemo(() => items.slice(1), [items]);
  const participationId = primary?.participationId ?? null;
  const campaignId = primary?.campaignId ?? null;
  const campaignName = primary?.campaignName ?? '';

  const progress = participationId ? progressData[participationId] : undefined;

  useEffect(() => {
    if (!participationId) return;
    void fetchProgress(participationId);
  }, [participationId, fetchProgress]);

  useEffect(() => {
    setShowRemaining(false);
  }, [participationId]);

  const percentage = Math.max(0, Math.min(100, Number(progress?.summary?.percentage ?? 0)));
  const totalCompleted = Number(progress?.summary?.totalCompleted ?? 0);
  const totalRequired = Number(progress?.summary?.totalRequired ?? 0);

  const requirements = useMemo<RequirementItem[]>(() => {
    const list = progress?.progress ?? [];
    return list.map((item) => {
      const completedCount = Number(item.completedCount ?? 0);
      const requiredCount = Number(item.requiredCount ?? 0);
      return {
        id: item.id,
        label: formatContentType(item.contentType),
        completedCount,
        requiredCount,
        isCompleted: Boolean(item.isCompleted),
        statusLabel: deriveStatus({
          isCompleted: Boolean(item.isCompleted),
          completedCount,
          requiredCount,
        }),
      };
    });
  }, [progress?.progress]);

  // Primary card: show first deliverable only (keep Home compact).
  const visibleRequirements = requirements.slice(0, 1);
  const canOpen = Boolean(campaignId && participationId);
  const canShowRemaining = remaining.length > 0;

  const handleToggleRemaining = async () => {
    const next = !showRemaining;
    setShowRemaining(next);
    if (!next) return;

    const missing = remaining.filter((r) => !progressData[r.participationId]);
    if (missing.length === 0) return;

    setRemainingLoading(true);
    try {
      // Sequential to avoid zustand progressData race on parallel set()
      for (const r of missing) {
        await fetchProgress(r.participationId);
      }
    } finally {
      setRemainingLoading(false);
    }
  };

  if (!primary) {
    return (
      <View
        style={[
          styles.shell,
          { backgroundColor: shell.card, borderColor: shell.cardBorder },
          style,
        ]}
      >
        <Text style={[styles.empty, { color: shell.textSecondary }]}>
          Track progress once you join an active campaign.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.shell, { backgroundColor: shell.card, borderColor: shell.cardBorder }, style]}
    >
      <View style={styles.header}>
        <View style={[styles.iconWell, { backgroundColor: shell.iceBlue }]}>
          <Ionicons name="stats-chart" size={18} color={shell.cta} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.eyebrow, { color: shell.textSecondary }]}>Campaign progress</Text>
          <Text style={[styles.campaignName, { color: shell.textPrimary }]} numberOfLines={1}>
            {campaignName || 'Your campaign'}
          </Text>
        </View>
        <View
          style={[styles.percentPill, { backgroundColor: shell.isDark ? '#1E2A44' : '#141E33' }]}
        >
          <Text style={styles.percentText}>{Math.round(percentage)}%</Text>
        </View>
      </View>

      {isLoading && !progress ? (
        <ActivityIndicator color={shell.cta} style={{ marginVertical: 12 }} />
      ) : !progress || requirements.length === 0 ? (
        <Text style={[styles.empty, { color: shell.textSecondary }]}>
          Track progress once deliverables start for this campaign.
        </Text>
      ) : (
        <>
          <View
            style={[
              styles.track,
              {
                backgroundColor: shell.isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(20, 30, 51, 0.1)',
              },
            ]}
          >
            <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: shell.cta }]} />
          </View>
          <Text style={[styles.meta, { color: shell.textSecondary }]}>
            {totalRequired > 0
              ? `${totalCompleted} of ${totalRequired} deliverables done`
              : 'No deliverables yet'}
          </Text>

          <View style={styles.reqList}>
            {visibleRequirements.map((item) => (
              <RequirementRow key={item.id} item={item} />
            ))}
          </View>
        </>
      )}

      {canOpen ? (
        <Pressable
          onPress={() => {
            if (campaignId && participationId) onPress(campaignId, participationId);
          }}
          style={styles.ctaRow}
          accessibilityRole="button"
          accessibilityLabel="View full progress"
        >
          <Text style={[styles.ctaText, { color: shell.cta }]}>View full progress</Text>
          <Ionicons name="chevron-forward" size={16} color={shell.cta} />
        </Pressable>
      ) : null}

      {canShowRemaining ? (
        <PrimaryButton
          label={
            showRemaining
              ? 'Hide remaining campaigns'
              : `Show remaining campaigns (${remaining.length})`
          }
          onPress={() => void handleToggleRemaining()}
          compact
          pill
        />
      ) : null}

      {showRemaining && canShowRemaining ? (
        <View style={styles.remainingBlock}>
          {remainingLoading ? (
            <ActivityIndicator color={shell.cta} style={{ marginVertical: 8 }} />
          ) : (
            <ScrollView
              style={styles.remainingScroll}
              contentContainerStyle={styles.remainingScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {remaining.map((item) => {
                const data = progressData[item.participationId];
                const pct = Math.max(0, Math.min(100, Number(data?.summary?.percentage ?? 0)));
                const done = Number(data?.summary?.totalCompleted ?? 0);
                const req = Number(data?.summary?.totalRequired ?? 0);
                const meta =
                  req > 0
                    ? `${done} of ${req} deliverables done`
                    : data
                      ? 'No deliverables yet'
                      : 'Tap to open';

                return (
                  <OtherCampaignRow
                    key={item.participationId}
                    name={item.campaignName || 'Campaign'}
                    percentage={pct}
                    meta={meta}
                    onPress={() => onPress(item.campaignId, item.participationId)}
                  />
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: 30,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 28,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appShell.iceBlue,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: appShell.textSecondary,
  },
  campaignName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: -0.3,
    color: appShell.textPrimary,
  },
  percentPill: {
    minWidth: 44,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appShell.cta,
  },
  percentText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(20, 30, 51, 0.1)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: appShell.cta,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: appShell.textSecondary,
  },
  reqList: {
    gap: 8,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(20, 30, 51, 0.04)',
  },
  reqCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  reqTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: appShell.textPrimary,
  },
  reqMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: appShell.textSecondary,
  },
  chip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  chipDone: {
    backgroundColor: 'rgba(34, 199, 168, 0.16)',
  },
  chipDoneText: {
    color: '#0F766E',
  },
  chipProgress: {
    backgroundColor: 'rgba(20, 30, 51, 0.1)',
  },
  chipProgressText: {
    color: appShell.cta,
  },
  chipPending: {
    backgroundColor: 'rgba(107, 114, 128, 0.12)',
  },
  chipPendingText: {
    color: '#6B7280',
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  ctaText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: appShell.cta,
  },
  remainingBlock: {
    marginTop: 2,
  },
  remainingScroll: {
    maxHeight: 200,
  },
  remainingScrollContent: {
    gap: 8,
    paddingBottom: 4,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(20, 30, 51, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(20, 30, 51, 0.06)',
  },
  otherCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  otherName: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: appShell.textPrimary,
  },
  otherMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: appShell.textSecondary,
  },
  otherPercent: {
    minWidth: 40,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appShell.iceBlue,
  },
  otherPercentText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: appShell.cta,
  },
});
