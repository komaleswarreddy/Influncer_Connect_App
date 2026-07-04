import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollScreen, PremiumCard, SectionHeader } from '@/components/ui';
import { ugcApi } from '@/lib/ugc-api';
import { appShell, spacing } from '@/theme';

type BriefResponse = {
  brief?: Record<string, unknown>;
  hasApplied?: boolean;
  applicationStatus?: string | null;
};

export default function UgcBriefDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [brief, setBrief] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [pitch, setPitch] = useState('');
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

  const apply = async () => {
    if (!id || !pitch.trim()) {
      Alert.alert('Pitch required', 'Tell the brand why you are a fit.');
      return;
    }
    if (hasApplied) {
      Alert.alert('Already applied', 'You have already submitted an application for this brief.');
      return;
    }
    setSubmitting(true);
    try {
      await ugcApi.apply(id, { coverNote: pitch });
      Alert.alert('Applied', 'Your application was submitted. The brand will review it on the web dashboard.');
      router.back();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Apply failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScrollScreen>
        <ActivityIndicator color={appShell.cta} style={{ marginTop: spacing.lg }} />
      </ScrollScreen>
    );
  }

  if (loadError || !brief) {
    return (
      <ScrollScreen>
        <SectionHeader title="UGC brief" subtitle="Could not load this job" />
        <Text style={styles.error}>{loadError ?? 'Brief not found'}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => void load()}>
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => router.back()}>
          <Text style={[styles.btnText, styles.btnOutlineText]}>Back</Text>
        </TouchableOpacity>
      </ScrollScreen>
    );
  }

  const canApply = !hasApplied && String(brief.status) === 'open';

  return (
    <ScrollScreen safeAreaEdges={['bottom']}>
      <SectionHeader title={String(brief.title)} subtitle={String(brief.productName ?? '')} />
      <PremiumCard>
        <Text style={styles.body}>{String(brief.description)}</Text>
        <Text style={styles.meta}>
          ₹{Number(brief.budgetPerPiece ?? 0).toLocaleString('en-IN')} per piece ·{' '}
          {Number(brief.piecesNeeded ?? 1) - Number(brief.piecesFilled ?? 0)} spot(s) left
        </Text>
        <Text style={styles.metaSmall}>Content: {String(brief.contentType ?? '')}</Text>
        {brief.deadline ? (
          <Text style={styles.metaSmall}>
            Deadline: {new Date(String(brief.deadline)).toLocaleDateString('en-IN')}
          </Text>
        ) : null}
      </PremiumCard>

      {hasApplied ? (
        <PremiumCard style={{ marginTop: spacing.sm }}>
          <Text style={styles.applied}>
            Application status: {applicationStatus ?? 'submitted'}
          </Text>
          {applicationStatus === 'accepted' ? (
            <Text style={styles.metaSmall}>
              Go to My applications and tap this job to open Deliver content.
            </Text>
          ) : applicationStatus === 'in_progress' ? (
            <Text style={styles.metaSmall}>Check My applications for delivery status.</Text>
          ) : null}
        </PremiumCard>
      ) : null}

      {canApply ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Your pitch to the brand"
            value={pitch}
            onChangeText={setPitch}
            multiline
            editable={!submitting}
          />
          <TouchableOpacity
            style={[styles.btn, submitting && styles.btnDisabled]}
            disabled={submitting}
            onPress={() => void apply()}
          >
            <Text style={styles.btnText}>{submitting ? 'Submitting…' : 'Apply to this brief'}</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  body: { fontFamily: 'Inter_400Regular', color: appShell.textPrimary, marginBottom: spacing.sm },
  meta: { fontFamily: 'Inter_600SemiBold', color: appShell.cta, marginBottom: 4 },
  metaSmall: { fontFamily: 'Inter_400Regular', color: appShell.textSecondary, fontSize: 13, marginTop: 2 },
  applied: { fontFamily: 'Inter_600SemiBold', color: appShell.textPrimary },
  error: { color: appShell.textSecondary, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: appShell.cardBorder,
    borderRadius: 12,
    padding: spacing.md,
    minHeight: 100,
    marginTop: spacing.md,
    fontFamily: 'Inter_400Regular',
    color: appShell.textPrimary,
  },
  btn: {
    marginTop: spacing.md,
    backgroundColor: appShell.cta,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: appShell.cta },
  btnText: { color: '#fff', fontFamily: 'Inter_700Bold' },
  btnOutlineText: { color: appShell.cta },
});
