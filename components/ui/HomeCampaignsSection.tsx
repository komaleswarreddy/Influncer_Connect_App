import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useProgressStore } from '@/store/progress-store';
import { useHomeDesign, homeFonts, type HomeDesignTokens } from '@/theme/homeDesign';
import { HomeSectionLabel } from './HomeSectionLabel';

export type HomeCampaignItem = {
  participationId: string;
  campaignId: string;
  campaignName: string;
};

type Props = {
  items: HomeCampaignItem[];
  activeCount: number;
  onOpenCampaign: (campaignId: string, participationId: string) => void;
  onOpenAll: () => void;
  style?: StyleProp<ViewStyle>;
};

type Deliverable = {
  id: string;
  label: string;
  completedCount: number;
  requiredCount: number;
  isCompleted: boolean;
};

function formatContentType(raw: string): string {
  return String(raw || 'Deliverable')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function Chevron({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="m9 18 6-6-6-6"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function BarsGlyph({ color }: { color: string }) {
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24">
      <Path
        d="M6 20v-5M12 20V9M18 20v-8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function CheckGlyph({ color }: { color: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Path
        d="M20 6 9 17l-5-5"
        stroke={color}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function ClockGlyph({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2.8} fill="none" />
      <Path
        d="M12 7v5l3 2"
        stroke={color}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Vertical connector whose fill grows once mounted — the mock's scaleY transition. */
function Connector({ d, filled }: { d: HomeDesignTokens; filled: boolean }) {
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!filled) {
      grow.setValue(0);
      return;
    }
    const t = setTimeout(() => {
      Animated.timing(grow, {
        toValue: 1,
        duration: 900,
        easing: Easing.bezier(0.16, 0.84, 0.32, 1),
        useNativeDriver: true,
      }).start();
    }, 250);
    return () => clearTimeout(t);
  }, [filled, grow]);

  return (
    <View style={styles.connectorRow}>
      <View style={styles.connectorGutter}>
        <View style={[styles.connectorTrack, { backgroundColor: d.line }]}>
          <Animated.View
            style={[
              styles.connectorFill,
              { backgroundColor: d.ink, transform: [{ scaleY: grow }] },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function DoneRow({ d, label }: { d: HomeDesignTokens; label: string }) {
  return (
    <View style={styles.doneRow}>
      <View style={[styles.doneBullet, { backgroundColor: d.ink }]}>
        <CheckGlyph color={d.onInk} />
      </View>
      <Text style={[styles.doneLabel, { color: d.mut }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.doneTag, { color: d.mut }]}>Done</Text>
    </View>
  );
}

function NextUpRow({
  d,
  label,
  completedCount,
  requiredCount,
}: {
  d: HomeDesignTokens;
  label: string;
  completedCount: number;
  requiredCount: number;
}) {
  const inProgress = completedCount > 0;
  return (
    <View style={[styles.nextRow, { backgroundColor: d.tintSoft }]}>
      <View style={[styles.nextBullet, { borderColor: d.warn }]}>
        <ClockGlyph color={d.warn} />
      </View>
      <View style={styles.nextCopy}>
        <Text style={[styles.nextLabel, { color: d.ink }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.nextMeta, { color: d.mut }]}>
          {completedCount} of {requiredCount}
        </Text>
      </View>
      <Text style={[styles.nextTag, { color: d.warn }]}>
        {inProgress ? 'In progress' : 'Pending'}
      </Text>
    </View>
  );
}

function OtherCampaignRow({
  d,
  name,
  percentage,
  meta,
  onPress,
}: {
  d: HomeDesignTokens;
  name: string;
  percentage: number;
  meta: string;
  onPress: () => void;
}) {
  const initial = (name || 'C').slice(0, 1).toUpperCase();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.otherRow,
        { backgroundColor: d.surf, shadowColor: d.shadowColor, shadowOpacity: d.shadowOpacity },
        pressed && styles.pressed985,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${Math.round(percentage)} percent. ${meta}`}
    >
      <View style={[styles.otherMark, { backgroundColor: d.tint }]}>
        <Text style={[styles.otherMarkText, { color: d.ink }]}>{initial}</Text>
      </View>
      <View style={styles.otherCopy}>
        <Text style={[styles.otherName, { color: d.ink }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[styles.otherMeta, { color: d.mut }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Text style={[styles.otherPercent, { color: d.ink }]}>{Math.round(percentage)}%</Text>
    </Pressable>
  );
}

/** My Campaigns — progress timeline + expandable remaining list, per the Final Home Screen mock. */
export function HomeCampaignsSection({
  items,
  activeCount,
  onOpenCampaign,
  onOpenAll,
  style,
}: Props) {
  const d = useHomeDesign();
  const [showAll, setShowAll] = useState(false);
  const [remainingLoading, setRemainingLoading] = useState(false);
  const fetchProgress = useProgressStore((s) => s.fetchProgress);
  const isLoading = useProgressStore((s) => s.isLoading);
  const progressData = useProgressStore((s) => s.progressData);

  const primary = items[0] ?? null;
  const remaining = useMemo(() => items.slice(1), [items]);
  const participationId = primary?.participationId ?? null;
  const progress = participationId ? progressData[participationId] : undefined;

  const chevronSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!participationId) return;
    void fetchProgress(participationId);
  }, [participationId, fetchProgress]);

  useEffect(() => {
    setShowAll(false);
    chevronSpin.setValue(0);
  }, [participationId, chevronSpin]);

  const percentage = Math.max(0, Math.min(100, Number(progress?.summary?.percentage ?? 0)));
  const totalCompleted = Number(progress?.summary?.totalCompleted ?? 0);
  const totalRequired = Number(progress?.summary?.totalRequired ?? 0);

  const deliverables = useMemo<Deliverable[]>(
    () =>
      (progress?.progress ?? []).map((item) => ({
        id: item.id,
        label: formatContentType(item.contentType),
        completedCount: Number(item.completedCount ?? 0),
        requiredCount: Number(item.requiredCount ?? 0),
        isCompleted: Boolean(item.isCompleted),
      })),
    [progress?.progress]
  );

  const done = useMemo(() => deliverables.filter((x) => x.isCompleted), [deliverables]);
  const nextUp = useMemo(() => deliverables.find((x) => !x.isCompleted) ?? null, [deliverables]);
  // Keep the card compact: one completed row above the highlighted next-up row.
  const lastDone = done.length > 0 ? done[done.length - 1] : null;

  const handleToggleAll = async () => {
    const next = !showAll;
    setShowAll(next);
    Animated.timing(chevronSpin, {
      toValue: next ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.2, 0.8, 0.25, 1),
      useNativeDriver: true,
    }).start();
    if (!next) return;

    const missing = remaining.filter((r) => !progressData[r.participationId]);
    if (missing.length === 0) return;
    setRemainingLoading(true);
    try {
      for (const r of missing) {
        await fetchProgress(r.participationId);
      }
    } finally {
      setRemainingLoading(false);
    }
  };

  const spin = chevronSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  if (!primary) return null;

  return (
    <View style={style}>
      <HomeSectionLabel
        label="My Campaigns"
        badge={
          <View style={[styles.activeBadge, { backgroundColor: d.ink }]}>
            <Text style={[styles.activeBadgeText, { color: d.onInk }]}>{activeCount} active</Text>
          </View>
        }
        trailing={
          <Pressable
            onPress={onOpenAll}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="See all campaigns"
          >
            <Chevron color={d.ink} size={17} />
          </Pressable>
        }
      />

      <View
        style={[
          styles.card,
          {
            backgroundColor: d.surf,
            borderColor: d.line,
            shadowColor: d.shadowColor,
            shadowOpacity: d.shadowOpacity,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWell, { backgroundColor: d.tint }]}>
            <BarsGlyph color={d.ink} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: d.mut }]}>Campaign progress</Text>
            <Text style={[styles.campaignName, { color: d.ink }]} numberOfLines={1}>
              {primary.campaignName || 'Your campaign'}
            </Text>
          </View>
          <View style={[styles.percentPill, { backgroundColor: d.ink }]}>
            <Text style={[styles.percentText, { color: d.onInk }]}>{Math.round(percentage)}%</Text>
          </View>
        </View>

        {isLoading && !progress ? (
          <ActivityIndicator color={d.ink} style={styles.loader} />
        ) : deliverables.length === 0 ? (
          <Text style={[styles.empty, { color: d.mut }]}>
            Track progress once deliverables start for this campaign.
          </Text>
        ) : (
          <>
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: d.mut }]}>
                {totalRequired > 0
                  ? `${totalCompleted} of ${totalRequired} deliverables done`
                  : 'No deliverables yet'}
              </Text>
              {nextUp ? <Text style={[styles.nextUpLabel, { color: d.mut }]}>Next up</Text> : null}
            </View>

            <View style={styles.timeline}>
              {lastDone ? <DoneRow d={d} label={lastDone.label} /> : null}
              {lastDone && nextUp ? <Connector d={d} filled /> : null}
              {nextUp ? (
                <NextUpRow
                  d={d}
                  label={nextUp.label}
                  completedCount={nextUp.completedCount}
                  requiredCount={nextUp.requiredCount}
                />
              ) : null}
            </View>
          </>
        )}

        <Pressable
          onPress={() => onOpenCampaign(primary.campaignId, primary.participationId)}
          style={styles.viewFullRow}
          accessibilityRole="button"
          accessibilityLabel="View full progress"
        >
          <Text style={[styles.viewFullText, { color: d.ink }]}>View full progress</Text>
          <Chevron color={d.ink} />
        </Pressable>
      </View>

      {showAll && remaining.length > 0 ? (
        <View style={styles.remainingBlock}>
          {remainingLoading ? (
            <ActivityIndicator color={d.ink} style={styles.loader} />
          ) : (
            remaining.map((item) => {
              const data = progressData[item.participationId];
              const pct = Math.max(0, Math.min(100, Number(data?.summary?.percentage ?? 0)));
              const doneN = Number(data?.summary?.totalCompleted ?? 0);
              const reqN = Number(data?.summary?.totalRequired ?? 0);
              const meta =
                reqN > 0
                  ? `${doneN} of ${reqN} deliverables done`
                  : data
                    ? 'No deliverables yet'
                    : 'Tap to open';
              return (
                <OtherCampaignRow
                  key={item.participationId}
                  d={d}
                  name={item.campaignName || 'Campaign'}
                  percentage={pct}
                  meta={meta}
                  onPress={() => onOpenCampaign(item.campaignId, item.participationId)}
                />
              );
            })
          )}
        </View>
      ) : null}

      {remaining.length > 0 ? (
        <Pressable
          onPress={() => void handleToggleAll()}
          style={({ pressed }) => [
            styles.moreButton,
            { backgroundColor: d.ink, shadowColor: d.shadowColor },
            pressed && styles.pressed975,
          ]}
          accessibilityRole="button"
          accessibilityState={{ expanded: showAll }}
        >
          <Text style={[styles.moreText, { color: d.onInk }]}>
            {showAll
              ? 'Hide remaining campaigns'
              : `Show remaining campaigns (${remaining.length})`}
          </Text>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path
                d="m6 9 6 6 6-6"
                stroke={d.onInk}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Animated.View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  activeBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  activeBadgeText: {
    fontFamily: homeFonts.bold,
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    padding: 16,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowRadius: 10 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: homeFonts.bold,
    fontSize: 10.5,
    letterSpacing: 1.35,
    textTransform: 'uppercase',
  },
  campaignName: {
    fontFamily: homeFonts.displayBold,
    fontSize: 19,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  percentPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  percentText: {
    fontFamily: homeFonts.bold,
    fontSize: 14,
    letterSpacing: -0.3,
  },
  loader: {
    marginVertical: 14,
  },
  empty: {
    fontFamily: homeFonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 15,
  },
  metaText: {
    fontFamily: homeFonts.medium,
    fontSize: 12.5,
  },
  nextUpLabel: {
    fontFamily: homeFonts.bold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  timeline: {
    marginTop: 12,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doneBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: homeFonts.medium,
    fontSize: 13.5,
    textDecorationLine: 'line-through',
  },
  doneTag: {
    fontFamily: homeFonts.bold,
    fontSize: 10.5,
    letterSpacing: 1.05,
    textTransform: 'uppercase',
  },
  connectorRow: {
    flexDirection: 'row',
    height: 22,
  },
  connectorGutter: {
    width: 24,
    alignItems: 'center',
  },
  connectorTrack: {
    width: 3,
    flex: 1,
    borderRadius: 2,
    overflow: 'hidden',
  },
  connectorFill: {
    flex: 1,
    transformOrigin: 'top',
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginHorizontal: -2,
  },
  nextBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCopy: {
    flex: 1,
    minWidth: 0,
  },
  nextLabel: {
    fontFamily: homeFonts.bold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  nextMeta: {
    fontFamily: homeFonts.medium,
    fontSize: 11.5,
    marginTop: 1,
  },
  nextTag: {
    fontFamily: homeFonts.bold,
    fontSize: 10.5,
    letterSpacing: 0.95,
    textTransform: 'uppercase',
  },
  viewFullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  viewFullText: {
    fontFamily: homeFonts.bold,
    fontSize: 13.5,
    letterSpacing: -0.2,
  },
  remainingBlock: {
    marginTop: 12,
    gap: 10,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingVertical: 13,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowRadius: 10 },
      android: { elevation: 2 },
      default: {},
    }),
  },
  otherMark: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherMarkText: {
    fontFamily: homeFonts.displayBold,
    fontSize: 16,
  },
  otherCopy: {
    flex: 1,
    minWidth: 0,
  },
  otherName: {
    fontFamily: homeFonts.displaySemiBold,
    fontSize: 16,
    letterSpacing: -0.4,
  },
  otherMeta: {
    fontFamily: homeFonts.medium,
    fontSize: 12,
    marginTop: 1,
  },
  otherPercent: {
    fontFamily: homeFonts.displayBold,
    fontSize: 15,
    letterSpacing: -0.4,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 16,
    marginTop: 14,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.24, shadowRadius: 20 },
      android: { elevation: 6 },
      default: {},
    }),
  },
  moreText: {
    fontFamily: homeFonts.bold,
    fontSize: 14.5,
    letterSpacing: -0.2,
  },
  pressed985: {
    transform: [{ scale: 0.985 }],
  },
  pressed975: {
    transform: [{ scale: 0.975 }],
  },
});
