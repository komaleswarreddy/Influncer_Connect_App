import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useProgressStore } from '@/store/progress-store';
import { useKollab, font, type as kType } from '@/theme/kollab-tokens';
import { KollabSectionLabel } from './KollabSectionLabel';
import { Glyph } from './Glyph';

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

function formatContentType(raw: string): string {
  return String(raw || 'Deliverable')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function MineCollabCard({
  item,
  width,
  onOpen,
}: {
  item: HomeCampaignItem;
  width: number;
  onOpen: () => void;
}) {
  const kollab = useKollab();
  const fetchProgress = useProgressStore((s) => s.fetchProgress);
  const isLoading = useProgressStore((s) => s.isLoading);
  const progress = useProgressStore((s) => s.progressData[item.participationId]);

  useEffect(() => {
    void fetchProgress(item.participationId);
  }, [item.participationId, fetchProgress]);

  const percentage = Math.max(0, Math.min(100, Number(progress?.summary?.percentage ?? 0)));
  const totalCompleted = Number(progress?.summary?.totalCompleted ?? 0);
  const totalRequired = Number(progress?.summary?.totalRequired ?? 0);
  const rows = useMemo(
    () =>
      (progress?.progress ?? []).map((d) => ({
        id: d.id,
        label: formatContentType(d.contentType),
        completedCount: Number(d.completedCount ?? 0),
        requiredCount: Number(d.requiredCount ?? 0),
        done: Boolean(d.isCompleted),
      })),
    [progress?.progress]
  );

  return (
    <View style={[styles.card, { width, backgroundColor: kollab.color.card }, kollab.shadow.card]}>
      <View style={styles.top}>
        <View style={styles.topCopy}>
          <View style={styles.eyebrowRow}>
            <View style={[styles.barsWell, { backgroundColor: kollab.color.well }]}>
              <Glyph name="bars" color={kollab.color.ink} size={12} />
            </View>
            <Text style={[styles.eyebrow, { color: kollab.color.ink }]}>collab progress</Text>
          </View>
          <Text style={[styles.name, { color: kollab.color.ink }]} numberOfLines={2}>
            {item.campaignName || 'Your campaign'}
          </Text>
          <Text style={[styles.doneLine, { color: kollab.color.ink }]}>
            {totalRequired > 0
              ? `${totalCompleted} of ${totalRequired} deliverables done`
              : 'No deliverables yet'}
          </Text>
        </View>
        <View style={[styles.pct, { backgroundColor: kollab.color.panel }]}>
          <Text style={[styles.pctText, { color: kollab.color.chartreuse }]}>
            {Math.round(percentage)}%
          </Text>
        </View>
      </View>

      <View style={styles.nextHead}>
        <Text style={[styles.nextLabel, { color: kollab.color.ink }]}>next up</Text>
      </View>

      {isLoading && !progress ? (
        <ActivityIndicator color={kollab.color.ink} style={styles.loader} />
      ) : rows.length === 0 ? (
        <Text style={[styles.empty, { color: kollab.color.inkMuted }]}>
          Track progress once deliverables start.
        </Text>
      ) : (
        rows.map((r) => (
          <View key={r.id} style={[styles.row, { borderTopColor: kollab.color.hairline }]}>
            <View
              style={[
                styles.well,
                { backgroundColor: r.done ? kollab.color.tealTint : kollab.color.well },
              ]}
            >
              <Glyph
                name={r.done ? 'check' : 'cal'}
                color={r.done ? kollab.color.teal : kollab.color.heat}
                size={15}
              />
            </View>
            <View style={styles.rowCopy}>
              <Text
                style={[
                  styles.rowTitle,
                  {
                    color: kollab.color.ink,
                    textDecorationLine: r.done ? 'line-through' : 'none',
                    opacity: r.done ? 0.45 : 1,
                  },
                ]}
                numberOfLines={1}
              >
                {r.label}
              </Text>
              {r.done ? null : (
                <Text style={[styles.rowCount, { color: kollab.color.inkMuted }]}>
                  {r.completedCount} of {r.requiredCount}
                </Text>
              )}
            </View>
            <Text
              style={[styles.chip, { color: r.done ? kollab.color.inkFaint : kollab.color.heat }]}
            >
              {r.done ? 'DONE' : 'PENDING'}
            </Text>
          </View>
        ))
      )}

      <Pressable
        onPress={onOpen}
        style={[styles.viewFull, { borderTopColor: kollab.color.hairline }]}
        accessibilityRole="button"
        accessibilityLabel="View full progress"
      >
        <Text style={[styles.viewFullText, { color: kollab.color.ink }]}>View full progress</Text>
        <Text style={[styles.caret, { color: kollab.color.ink }]}>›</Text>
      </Pressable>
    </View>
  );
}

export function HomeCampaignsSection({
  items,
  activeCount,
  onOpenCampaign,
  onOpenAll,
  style,
}: Props) {
  const kollab = useKollab();
  const { width: winW } = useWindowDimensions();
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, 1);
  const remaining = Math.max(0, items.length - 1);
  const cardWidth = showAll ? 302 : Math.max(260, winW - 36);

  if (items.length === 0) return null;

  return (
    <View style={style}>
      <Pressable onPress={onOpenAll} accessibilityRole="button">
        <KollabSectionLabel
          style={styles.sectionPad}
          label="my collabs"
          badge={
            <View style={[styles.activeBadge, { backgroundColor: kollab.color.chartreuse }]}>
              <Text style={[styles.activeBadgeText, { color: kollab.color.onChartreuse }]}>
                {activeCount} active
              </Text>
            </View>
          }
          trailing={<Text style={[styles.sectionCaret, { color: kollab.color.ink }]}>›</Text>}
        />
      </Pressable>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={showAll ? 314 : undefined}
        decelerationRate="fast"
        contentContainerStyle={styles.rail}
      >
        {visible.map((item) => (
          <MineCollabCard
            key={item.participationId}
            item={item}
            width={cardWidth}
            onOpen={() => onOpenCampaign(item.campaignId, item.participationId)}
          />
        ))}
      </ScrollView>
      {remaining > 0 ? (
        <Pressable
          onPress={() => setShowAll((v) => !v)}
          style={[styles.more, { backgroundColor: kollab.color.panel }]}
          accessibilityRole="button"
        >
          <Text style={[styles.moreText, { color: kollab.color.chartreuse }]}>
            {showAll ? 'Show less' : `Show remaining collabs (${remaining})`}
          </Text>
          <Text
            style={[
              styles.moreCaret,
              {
                color: kollab.color.chartreuse,
                transform: [{ rotate: showAll ? '180deg' : '0deg' }],
              },
            ]}
          >
            ▾
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionPad: {
    marginHorizontal: 22,
    marginTop: 24,
    marginBottom: 10,
  },
  activeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: {
    fontFamily: font.bold,
    fontSize: 11,
  },
  sectionCaret: {
    fontSize: 16,
    opacity: 0.4,
  },
  rail: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 6,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    borderCurve: 'continuous',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  topCopy: { flex: 1, minWidth: 0 },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  barsWell: {
    width: 22,
    height: 22,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontFamily: font.bold,
    fontSize: 11,
    letterSpacing: 0.72,
    textTransform: 'uppercase',
    opacity: 0.55,
  },
  name: {
    ...kType.sectionTitle,
    marginTop: 8,
    marginBottom: 4,
  },
  doneLine: {
    fontFamily: font.body,
    fontSize: 12.5,
    opacity: 0.55,
  },
  pct: {
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 15,
    flexShrink: 0,
  },
  pctText: {
    fontFamily: font.display,
    fontSize: 17,
  },
  nextHead: {
    alignItems: 'flex-end',
    marginTop: 14,
    marginBottom: 6,
  },
  nextLabel: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 0.84,
    textTransform: 'uppercase',
    opacity: 0.45,
  },
  loader: { marginVertical: 16 },
  empty: {
    fontFamily: font.body,
    fontSize: 13,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  well: {
    width: 30,
    height: 30,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontFamily: font.semiBold,
    fontSize: 13.5,
  },
  rowCount: {
    fontFamily: font.body,
    fontSize: 11.5,
    marginTop: 2,
    opacity: 0.5,
  },
  chip: {
    fontFamily: font.bold,
    fontSize: 10.5,
    letterSpacing: 0.84,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  viewFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 13,
    marginTop: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  viewFullText: {
    fontFamily: font.semiBold,
    fontSize: 13,
  },
  caret: { fontSize: 16, opacity: 0.4 },
  more: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 12,
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 22,
  },
  moreText: {
    fontFamily: font.semiBold,
    fontSize: 14,
  },
  moreCaret: {
    fontSize: 12,
  },
});
