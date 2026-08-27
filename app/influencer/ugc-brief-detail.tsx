import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollScreen, KollabScreenHeader, KollabButton, showKollabToast } from '@/components/ui';
import { ugcApi } from '@/lib/ugc-api';
import { applicationStatusLabel, type UgcApplicationRow } from '@/store/ugc-store';
import { formatInr } from '@/lib/currency';
import { useKollab, font, space, type as kType } from '@/theme/kollab-tokens';

type BriefResponse = {
  brief?: Record<string, unknown>;
  hasApplied?: boolean;
  applicationStatus?: string | null;
  deliverableStatus?: string | null;
  paymentStatus?: string | null;
};

const DEFAULT_COVER_NOTE = "I'd like to create this content";

function contentChip(contentType: string): string {
  switch (contentType) {
    case 'video':
      return '1 vertical video';
    case 'photo':
      return 'Product stills';
    case 'reel':
      return '1 reel';
    case 'story':
      return 'Stories';
    case 'ugc_bundle':
      return 'UGC bundle';
    default:
      return contentType.replace(/_/g, ' ') || 'Content';
  }
}

function formatDeadline(raw: unknown): string {
  if (!raw) return '—';
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function UgcBriefDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const kollab = useKollab();
  const [brief, setBrief] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [deliverableStatus, setDeliverableStatus] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = (await ugcApi.getBrief(id)) as BriefResponse;
      if (!res.brief) {
        setLoadError('Brief not found');
        setBrief(null);
        return;
      }
      setBrief(res.brief);
      setHasApplied(Boolean(res.hasApplied));
      setApplicationStatus(res.applicationStatus ?? null);
      setDeliverableStatus(res.deliverableStatus ?? null);
      setPaymentStatus(res.paymentStatus ?? null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load brief');
      setBrief(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusRow = useMemo((): UgcApplicationRow | null => {
    if (!hasApplied) return null;
    return {
      application: {
        id: 'brief-detail',
        status: applicationStatus ?? 'pending',
      },
      deliverable: deliverableStatus ? { status: deliverableStatus } : null,
      payment: paymentStatus ? { status: paymentStatus } : null,
    };
  }, [hasApplied, applicationStatus, deliverableStatus, paymentStatus]);

  const statusLabel = statusRow ? applicationStatusLabel(statusRow) : null;

  const apply = async () => {
    if (!id) return;
    if (hasApplied) {
      showKollabToast('You have already submitted an application for this brief.');
      return;
    }
    setSubmitting(true);
    try {
      await ugcApi.apply(id, { coverNote: DEFAULT_COVER_NOTE });
      showKollabToast('Your application was submitted.');
      router.back();
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Apply failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScrollScreen canvasColor={kollab.color.screen}>
        <KollabScreenHeader title="UGC brief" backTone="well" />
        <ActivityIndicator color={kollab.color.ink} style={{ marginTop: space.lg }} />
      </ScrollScreen>
    );
  }

  if (loadError || !brief) {
    return (
      <ScrollScreen canvasColor={kollab.color.screen}>
        <KollabScreenHeader title="UGC brief" subtitle="Could not load this job" backTone="well" />
        <Text style={[styles.error, { color: kollab.color.ink }]}>
          {loadError ?? 'Brief not found'}
        </Text>
        <KollabButton label="Retry" onPress={() => void load()} style={styles.btnSpacing} />
        <KollabButton variant="hairline" label="Back" onPress={() => router.back()} />
      </ScrollScreen>
    );
  }

  const canApply = !hasApplied && String(brief.status) === 'open';
  const productNameText = String(brief.productName ?? '');
  const pieces = Number(brief.piecesNeeded ?? 1);
  const piecesLeft = pieces - Number(brief.piecesFilled ?? 0);
  const pillText = hasApplied && statusLabel ? `UGC brief · ${statusLabel}` : `UGC brief · Open`;
  const chips = [
    contentChip(String(brief.contentType ?? '')),
    `${pieces} ${pieces === 1 ? 'piece' : 'pieces'}`,
    'Raw files',
  ];

  return (
    <ScrollScreen canvasColor={kollab.color.screen}>
      <KollabScreenHeader title="UGC brief" backTone="well" />

      <View style={[styles.pill, { backgroundColor: kollab.color.chartreuse }]}>
        <Text style={[styles.pillText, { color: kollab.color.onChartreuse }]}>{pillText}</Text>
      </View>
      <Text style={[styles.title, { color: kollab.color.ink }]}>{String(brief.title)}</Text>
      {productNameText ? (
        <Text style={[styles.subtitle, { color: kollab.color.ink }]}>{productNameText}</Text>
      ) : null}

      <View style={styles.metrics}>
        <View style={[styles.metric, { backgroundColor: kollab.color.chartreuse }]}>
          <Text style={[styles.metricLabel, { color: kollab.color.onChartreuse }]}>rate</Text>
          <Text style={[styles.metricValue, { color: kollab.color.onChartreuse }]}>
            {formatInr(Number(brief.budgetPerPiece ?? 0))}
          </Text>
          <Text style={[styles.metricHint, { color: kollab.color.onChartreuse }]}>/ piece</Text>
        </View>
        <View style={[styles.metric, { backgroundColor: kollab.color.well }]}>
          <Text style={[styles.metricLabel, { color: kollab.color.ink }]}>deadline</Text>
          <Text style={[styles.metricValue, { color: kollab.color.ink }]}>
            {formatDeadline(brief.deadline)}
          </Text>
          <Text style={[styles.metricHint, { color: kollab.color.ink }]}>
            {piecesLeft > 0
              ? `${piecesLeft} spot${piecesLeft === 1 ? '' : 's'} left`
              : `${pieces} pieces`}
          </Text>
        </View>
      </View>

      <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>What to deliver</Text>
      <View style={styles.chipRow}>
        {chips.map((chip) => (
          <View key={chip} style={[styles.chip, { backgroundColor: kollab.color.well }]}>
            <Text style={[styles.chipText, { color: kollab.color.ink }]}>{chip}</Text>
          </View>
        ))}
      </View>

      {canApply ? (
        <KollabButton
          label={submitting ? 'Submitting…' : 'View & Apply'}
          disabled={submitting}
          onPress={() => void apply()}
        />
      ) : hasApplied && statusLabel ? (
        <Text style={[styles.applied, { color: kollab.color.ink }]}>{statusLabel}</Text>
      ) : null}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  pillText: { fontFamily: font.bold, fontSize: 11 },
  title: {
    fontFamily: font.display,
    fontSize: 29,
    letterSpacing: -0.5,
    lineHeight: 32,
    marginTop: 10,
    marginBottom: 4,
  },
  subtitle: { fontFamily: font.body, fontSize: 13, opacity: 0.55, marginBottom: 16 },
  metrics: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  metric: { flex: 1, borderRadius: 18, padding: 14 },
  metricLabel: { fontFamily: font.body, fontSize: 11, opacity: 0.6 },
  metricValue: { ...kType.sectionTitle, marginTop: 2 },
  metricHint: { fontFamily: font.body, fontSize: 11, opacity: 0.55 },
  fieldLabel: {
    fontFamily: font.semiBold,
    fontSize: 12.5,
    opacity: 0.62,
    marginBottom: 7,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { fontFamily: font.semiBold, fontSize: 12.5 },
  applied: { fontFamily: font.semiBold, fontSize: 13.5, opacity: 0.7 },
  error: { fontFamily: font.body, marginBottom: space.md },
  btnSpacing: { marginBottom: space.md },
});
