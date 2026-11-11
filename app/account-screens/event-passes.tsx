import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  KollabButton,
  KollabEmptyCard,
  KollabScreenHeader,
  KollabTextField,
  ScrollScreen,
  showKollabConfirm,
  showKollabToast,
} from '@/components/ui';
import { eventsApi, type EventDetail, type EventPass } from '@/lib/events-api';
import { parseAmount } from '@/lib/invoice-math';
import { formatInr } from '@/lib/currency';
import { font, useKollab } from '@/theme/kollab-tokens';

interface PassDraft {
  id: string | null;
  name: string;
  description: string;
  price: string;
  quantity: string;
  maxPerOrder: string;
}

const blank = (): PassDraft => ({
  id: null,
  name: '',
  description: '',
  price: '',
  quantity: '50',
  maxPerOrder: '5',
});

export default function EventPassesScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = typeof id === 'string' ? id : '';

  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<PassDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishProblem, setPublishProblem] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) {
      setError('Event not found');
      setLoading(false);
      return;
    }
    try {
      setDetail(await eventsApi.get(eventId));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this event');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const editPass = (p: EventPass) =>
    setDraft({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      price: p.price ? String(p.price) : '',
      quantity: String(p.quantity),
      maxPerOrder: String(p.maxPerOrder),
    });

  const savePass = async () => {
    if (!draft || !detail) return;
    const body = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      price: parseAmount(draft.price),
      quantity: Math.floor(parseAmount(draft.quantity)),
      maxPerOrder: Math.floor(parseAmount(draft.maxPerOrder)),
    };
    if (!body.name) return showKollabToast('Give the pass a name');
    if (body.quantity < 1) return showKollabToast('Offer at least 1 ticket');
    if (body.maxPerOrder < 1 || body.maxPerOrder > 10)
      return showKollabToast('Tickets per order must be between 1 and 10');
    if (body.price > 0 && body.price < 1)
      return showKollabToast('A paid pass must cost at least ₹1, or be free');
    setSaving(true);
    try {
      if (draft.id) await eventsApi.updatePass(eventId, draft.id, body);
      else await eventsApi.addPass(eventId, body);
      setDraft(null);
      await load();
      showKollabToast(draft.id ? 'Pass updated' : 'Pass added');
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not save the pass');
    } finally {
      setSaving(false);
    }
  };

  const removePass = async (p: EventPass) => {
    const ok = await showKollabConfirm({
      title: 'Delete this pass?',
      message: `“${p.name}” will be removed.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await eventsApi.removePass(eventId, p.id);
      await load();
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not delete the pass');
    }
  };

  const publish = async () => {
    setPublishing(true);
    setPublishProblem(null);
    try {
      await eventsApi.publish(eventId);
      showKollabToast('Your event is live');
      router.replace(`/account-screens/event-detail?id=${eventId}` as never);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not publish the event';
      setPublishProblem(msg);
      showKollabToast(msg);
    } finally {
      setPublishing(false);
    }
  };

  const passes = detail?.passes ?? [];
  const hasPaid = passes.some((p) => p.price > 0);
  const isDraft = detail?.event.status === 'draft';

  return (
    <ScrollScreen
      safeAreaEdges={['top', 'left', 'right', 'bottom']}
      scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
    >
      <KollabScreenHeader
        title="Passes"
        subtitle={detail?.event.title ?? 'Ticket types for your event'}
      />

      {loading ? (
        <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />
      ) : error || !detail ? (
        <KollabEmptyCard
          title="Couldn’t open this event"
          subtitle={error ?? 'Please try again.'}
          ctaLabel="Back to events"
          onPress={() => router.replace('/account-screens/events' as never)}
          style={{ marginHorizontal: 0 }}
        />
      ) : (
        <View style={styles.stack}>
          {hasPaid && !detail.paymentsEnabled ? (
            <View style={[styles.banner, { backgroundColor: c.heatTint }]}>
              <Text style={[styles.bannerText, { color: c.heat }]}>
                Online payments are not enabled on this server yet, so paid passes can not be sold.
                Make the passes free, or ask your admin to enable payments.
              </Text>
            </View>
          ) : null}

          {passes.length === 0 && !draft ? (
            <KollabEmptyCard
              title="No passes yet"
              subtitle="Add the ticket types people can book, like General or VIP."
              ctaLabel="Add a pass"
              onPress={() => setDraft(blank())}
              style={{ marginHorizontal: 0 }}
            />
          ) : null}

          {passes.map((p) => (
            <View key={p.id} style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
              <View style={styles.rowBetween}>
                <Text style={[styles.name, { color: c.ink }]}>{p.name}</Text>
                <Text style={[styles.price, { color: c.violetDeep }]}>
                  {p.price === 0 ? 'Free' : formatInr(p.price)}
                </Text>
              </View>
              {p.description ? (
                <Text style={[styles.muted, { color: c.ink }]}>{p.description}</Text>
              ) : null}
              <Text style={[styles.muted, { color: c.ink }]}>
                {p.sold} sold · {p.remaining ?? p.quantity - p.sold} left of {p.quantity} · max{' '}
                {p.maxPerOrder} per order
              </Text>
              <View style={styles.row}>
                <KollabButton
                  label="Edit"
                  variant="soft"
                  compact
                  onPress={() => editPass(p)}
                  style={styles.flex}
                />
                <KollabButton
                  label="Delete"
                  variant="hairline"
                  compact
                  onPress={() => void removePass(p)}
                  style={styles.flex}
                />
              </View>
            </View>
          ))}

          {draft ? (
            <View style={[styles.card, { backgroundColor: c.card }, kollab.shadow.card]}>
              <Text style={[styles.name, { color: c.ink }]}>
                {draft.id ? 'Edit pass' : 'New pass'}
              </Text>
              <Text style={[styles.label, { color: c.ink }]}>
                Pass name <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <KollabTextField
                surface="well"
                value={draft.name}
                onChangeText={(v) => setDraft({ ...draft, name: v })}
                placeholder="Pass name, e.g. General"
                maxLength={60}
              />
              <KollabTextField
                surface="well"
                value={draft.description}
                onChangeText={(v) => setDraft({ ...draft, description: v })}
                placeholder="What is included (optional)"
                maxLength={300}
              />
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={[styles.label, { color: c.ink }]}>Price (₹, 0 = free)</Text>
                  <KollabTextField
                    surface="well"
                    value={draft.price}
                    onChangeText={(v) => setDraft({ ...draft, price: v })}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.label, { color: c.ink }]}>
                    Tickets available <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <KollabTextField
                    surface="well"
                    value={draft.quantity}
                    onChangeText={(v) => setDraft({ ...draft, quantity: v })}
                    keyboardType="number-pad"
                    placeholder="50"
                  />
                </View>
              </View>
              <Text style={[styles.label, { color: c.ink }]}>
                Max tickets per order <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <KollabTextField
                surface="well"
                value={draft.maxPerOrder}
                onChangeText={(v) => setDraft({ ...draft, maxPerOrder: v })}
                keyboardType="number-pad"
                placeholder="5"
              />
              <View style={styles.row}>
                <KollabButton
                  label="Cancel"
                  variant="soft"
                  compact
                  onPress={() => setDraft(null)}
                  style={styles.flex}
                />
                <KollabButton
                  label={draft.id ? 'Save pass' : 'Add pass'}
                  variant="ink"
                  compact
                  loading={saving}
                  onPress={() => void savePass()}
                  style={styles.flex}
                />
              </View>
            </View>
          ) : passes.length > 0 ? (
            <KollabButton
              label="Add another pass"
              variant="hairline"
              onPress={() => setDraft(blank())}
            />
          ) : null}

          {publishProblem ? (
            <Text style={[styles.problem, { color: c.heat }]}>{publishProblem}</Text>
          ) : null}

          {isDraft ? (
            <>
              <KollabButton
                label="Publish event"
                variant="primary"
                loading={publishing}
                onPress={() => void publish()}
              />
              <KollabButton
                label="Save and finish later"
                variant="soft"
                onPress={() =>
                  router.replace(`/account-screens/event-detail?id=${eventId}` as never)
                }
              />
            </>
          ) : (
            <KollabButton
              label="Done"
              variant="ink"
              onPress={() => router.replace(`/account-screens/event-detail?id=${eventId}` as never)}
            />
          )}
        </View>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  banner: { borderRadius: 16, padding: 14 },
  bannerText: { fontFamily: font.semiBold, fontSize: 13, lineHeight: 18 },
  card: { borderRadius: 20, padding: 16, gap: 8 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  name: { fontFamily: font.bold, fontSize: 16 },
  price: { fontFamily: font.display, fontSize: 22 },
  muted: { fontFamily: font.body, fontSize: 13, opacity: 0.6, lineHeight: 18 },
  label: {
    fontFamily: font.semiBold,
    fontSize: 12.5,
    opacity: 0.7,
    marginLeft: 4,
    marginBottom: 4,
  },
  row: { flexDirection: 'row', gap: 10, marginTop: 4 },
  flex: { flex: 1 },
  problem: { fontFamily: font.semiBold, fontSize: 13.5, textAlign: 'center' },
});
