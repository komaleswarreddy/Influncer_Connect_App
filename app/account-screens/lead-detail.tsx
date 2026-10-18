import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  KollabButton,
  KollabEmptyCard,
  KollabScreenHeader,
  KollabStatusChip,
  KollabTextField,
  ScrollScreen,
  showKollabConfirm,
  showKollabToast,
} from '@/components/ui';
import { LEAD_STAGES, leadsApi, type Lead, type LeadStage } from '@/lib/leads-api';
import { LEAD_STAGE_UI, mailtoLink, telLink, timeAgo, whatsappLink } from '@/lib/leads-ui';
import { formatInr } from '@/lib/currency';
import { parseAmount } from '@/lib/invoice-math';
import { font, useKollab } from '@/theme/kollab-tokens';

export default function LeadDetailScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const { id } = useLocalSearchParams<{ id: string }>();
  const leadId = typeof id === 'string' ? id : '';

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);
  const [wonOpen, setWonOpen] = useState(false);
  const [wonValue, setWonValue] = useState('');

  const load = useCallback(async () => {
    if (!leadId) {
      setLoadError('Lead not found');
      setLoading(false);
      return;
    }
    try {
      const res = await leadsApi.get(leadId);
      setLead(res.lead);
      // Do not clobber notes the creator is typing when the screen refocuses.
      setNotes((prev) => (notesDirty ? prev : (res.lead.notes ?? '')));
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load this lead');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const run = async (key: string, task: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    try {
      await task();
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  const open = async (url: string | null, what: string) => {
    if (!url) {
      showKollabToast(`No valid ${what} on this lead`);
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      showKollabToast(`Could not open ${what}`);
    }
  };

  const moveTo = (stage: LeadStage) => {
    if (!lead || lead.stage === stage) return;
    if (stage === 'won') {
      setWonValue(lead.valueAmount != null ? String(lead.valueAmount) : '');
      setWonOpen(true);
      return;
    }
    setWonOpen(false);
    void run('stage', async () => {
      const res = await leadsApi.setStage(lead.id, stage);
      setLead(res.lead);
      showKollabToast(`Moved to ${LEAD_STAGE_UI[stage].label}`);
    });
  };

  const confirmWon = () =>
    run('stage', async () => {
      if (!lead) return;
      const value = parseAmount(wonValue);
      const res = await leadsApi.setStage(lead.id, 'won', value > 0 ? value : null);
      setLead(res.lead);
      setWonOpen(false);
      showKollabToast('Marked as won');
    });

  const saveNotes = () =>
    run('notes', async () => {
      if (!lead) return;
      const res = await leadsApi.update(lead.id, { notes: notes.trim() });
      setLead(res.lead);
      setNotes(res.lead.notes ?? '');
      setNotesDirty(false);
      showKollabToast('Notes saved');
    });

  const remove = async () => {
    if (!lead) return;
    const ok = await showKollabConfirm({
      title: 'Delete this lead?',
      message: `${lead.name} will be removed permanently.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await run('delete', async () => {
      await leadsApi.remove(lead.id);
      showKollabToast('Lead deleted');
      router.replace('/account-screens/leads' as never);
    });
  };

  const createInvoice = () => {
    if (!lead) return;
    const params = new URLSearchParams({ tab: 'create', brandName: lead.company || lead.name });
    if (lead.email) params.set('brandEmail', lead.email);
    if (lead.company) params.set('contactName', lead.name);
    router.push(`/account-screens/invoices?${params.toString()}` as never);
  };

  if (loading) {
    return (
      <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
        <KollabScreenHeader title="Lead" />
        <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />
      </ScrollScreen>
    );
  }

  if (!lead) {
    return (
      <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
        <KollabScreenHeader title="Lead" />
        <KollabEmptyCard
          title="Couldn’t open this lead"
          subtitle={loadError ?? 'It may have been deleted.'}
          ctaLabel="Back to leads"
          onPress={() => router.replace('/account-screens/leads' as never)}
          style={{ marginHorizontal: 0 }}
        />
      </ScrollScreen>
    );
  }

  const ui = LEAD_STAGE_UI[lead.stage];
  const wa = whatsappLink(lead.phone);
  const tel = telLink(lead.phone);
  const mail = mailtoLink(lead.email, `Re: your enquiry`);

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
    >
      <KollabScreenHeader title={lead.name} subtitle={lead.company ?? undefined} />

      <View style={[styles.hero, { backgroundColor: c.panel }]}>
        <KollabStatusChip tone={ui.tone} label={ui.label} />
        {lead.valueAmount != null ? (
          <Text style={[styles.heroValue, { color: c.panelInk }]}>
            {formatInr(lead.valueAmount)}
          </Text>
        ) : null}
        <Text style={[styles.heroMeta, { color: c.panelInk }]}>
          {lead.source === 'media_kit' ? 'Came in through your media kit' : 'Added by you'} ·{' '}
          {timeAgo(lead.createdAt)}
        </Text>
        {lead.lastContactedAt ? (
          <Text style={[styles.heroMeta, { color: c.panelInk }]}>
            Last contacted {timeAgo(lead.lastContactedAt)}
          </Text>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
        <Text style={[styles.cardTitle, { color: c.ink }]}>Contact</Text>
        {lead.email ? (
          <Text style={[styles.line, { color: c.ink }]} selectable>
            {lead.email}
          </Text>
        ) : null}
        {lead.phone ? (
          <Text style={[styles.line, { color: c.ink }]} selectable>
            {lead.phone}
          </Text>
        ) : null}
        {lead.budgetText ? (
          <Text style={[styles.line, { color: c.ink }]}>Budget: {lead.budgetText}</Text>
        ) : null}
        {!lead.email && !lead.phone && !lead.budgetText ? (
          <Text style={[styles.line, { color: c.ink }]}>No contact details saved.</Text>
        ) : null}
        <View style={styles.row}>
          <KollabButton
            label="Email"
            variant="soft"
            compact
            disabled={!mail}
            onPress={() => void open(mail, 'email address')}
            style={styles.flex}
          />
          <KollabButton
            label="WhatsApp"
            variant="soft"
            compact
            disabled={!wa}
            onPress={() => void open(wa, 'phone number')}
            style={styles.flex}
          />
          <KollabButton
            label="Call"
            variant="soft"
            compact
            disabled={!tel}
            onPress={() => void open(tel, 'phone number')}
            style={styles.flex}
          />
        </View>
      </View>

      {lead.message ? (
        <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
          <Text style={[styles.cardTitle, { color: c.ink }]}>
            {lead.source === 'media_kit' ? 'Their message' : 'What they need'}
          </Text>
          <Text style={[styles.body, { color: c.ink }]} selectable>
            {lead.message}
          </Text>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
        <Text style={[styles.cardTitle, { color: c.ink }]}>Stage</Text>
        <View style={styles.stages}>
          {LEAD_STAGES.map((s) => {
            const on = lead.stage === s.key;
            const spec = kollab.choiceChip;
            return (
              <Pressable
                key={s.key}
                onPress={() => moveTo(s.key)}
                disabled={busy === 'stage'}
                style={[
                  styles.stageChip,
                  {
                    backgroundColor: on ? spec.selectedBg : spec.idleBg,
                    borderColor: on ? spec.selectedBorder : spec.idleBorder,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.stageText, { color: on ? spec.selectedFg : spec.idleFg }]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {wonOpen ? (
          <View style={styles.wonBox}>
            <Text style={[styles.line, { color: c.ink }]}>What is the deal worth? (optional)</Text>
            <KollabTextField
              surface="well"
              value={wonValue}
              onChangeText={setWonValue}
              placeholder="₹ amount"
              keyboardType="decimal-pad"
            />
            <View style={styles.row}>
              <KollabButton
                label="Cancel"
                variant="soft"
                compact
                onPress={() => setWonOpen(false)}
                style={styles.flex}
              />
              <KollabButton
                label="Mark won"
                variant="ink"
                compact
                loading={busy === 'stage'}
                onPress={() => void confirmWon()}
                style={styles.flex}
              />
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
        <Text style={[styles.cardTitle, { color: c.ink }]}>Your notes</Text>
        <KollabTextField
          surface="well"
          value={notes}
          onChangeText={(v) => {
            setNotes(v);
            setNotesDirty(true);
          }}
          placeholder="Call notes, quotes, next steps"
          multiline
          maxLength={2000}
        />
        <KollabButton
          label="Save notes"
          variant="soft"
          compact
          disabled={!notesDirty}
          loading={busy === 'notes'}
          onPress={() => void saveNotes()}
        />
      </View>

      <View style={styles.actions}>
        <KollabButton label="Create invoice" variant="ink" onPress={createInvoice} />
        {lead.source === 'manual' ? (
          <KollabButton
            label="Edit details"
            variant="soft"
            onPress={() => router.push(`/account-screens/lead-form?id=${lead.id}` as never)}
          />
        ) : null}
        <KollabButton
          label="Delete lead"
          variant="hairline"
          loading={busy === 'delete'}
          onPress={() => void remove()}
        />
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, padding: 18, gap: 8, marginBottom: 12 },
  heroValue: { fontFamily: font.display, fontSize: 34 },
  heroMeta: { fontFamily: font.body, fontSize: 13, opacity: 0.75 },
  card: { borderRadius: 20, padding: 16, gap: 8, marginBottom: 12 },
  cardTitle: { fontFamily: font.bold, fontSize: 13.5, opacity: 0.6 },
  line: { fontFamily: font.body, fontSize: 14, opacity: 0.8 },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 8, marginTop: 4 },
  flex: { flex: 1 },
  stages: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stageChip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  stageText: { fontFamily: font.semiBold, fontSize: 13 },
  wonBox: { gap: 8, marginTop: 6 },
  actions: { gap: 10, marginTop: 4 },
});
