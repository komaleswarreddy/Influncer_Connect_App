import { openExternalUrl } from '../../lib/safe-link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import {
  KollabButton,
  KollabScreenHeader,
  KollabTextField,
  ScrollScreen,
  showKollabToast,
} from '@/components/ui';
import { GoogleConnectCard } from '@/components/meet/GoogleConnectCard';
import { TimePickerSheet } from '@/components/meet/TimePickerSheet';
import {
  meetsApi,
  type MeetGoogleStatus,
  type MeetService,
  type MeetWindow,
} from '@/lib/meets-api';
import {
  DURATION_PRESETS,
  MAX_RANGES_PER_DAY,
  WEEKDAY_NAMES,
  defaultWindows,
  deviceTimezone,
  discountLabel,
  durationProblem,
  minuteLabel,
  parseMoney,
  priceProblem,
  windowsProblem,
} from '@/lib/meets-ui';
import { formatInr } from '@/lib/currency';
import { meetShareText } from '@/lib/share-text';
import { font, useKollab } from '@/theme/kollab-tokens';

type Step = 0 | 1 | 2 | 3;
type Range = { start: number; end: number };
type DayRanges = Record<number, Range[]>;

const STEPS: { title: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { title: 'Details', icon: 'create-outline' },
  { title: 'Availability', icon: 'calendar-outline' },
  { title: 'Pricing', icon: 'cash-outline' },
  { title: 'Link', icon: 'link-outline' },
];
const WEEK = [0, 1, 2, 3, 4, 5, 6];

const toDayRanges = (windows: MeetWindow[]): DayRanges => {
  const out: DayRanges = {};
  for (const w of windows) (out[w.weekday] ??= []).push({ start: w.startMinute, end: w.endMinute });
  for (const d of Object.keys(out)) out[Number(d)].sort((a, b) => a.start - b.start);
  return out;
};
const toWindows = (days: DayRanges): MeetWindow[] =>
  WEEK.flatMap((weekday) =>
    (days[weekday] ?? []).map((r) => ({ weekday, startMinute: r.start, endMinute: r.end }))
  );

export default function MeetFormScreen() {
  const router = useRouter();
  const kollab = useKollab();
  const c = kollab.color;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = typeof id === 'string' ? id : undefined;

  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(Boolean(editingId));
  const [busy, setBusy] = useState(false);
  const [serviceId, setServiceId] = useState<string | undefined>(editingId);
  const [saved, setSaved] = useState<MeetService | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [insights, setInsights] = useState<string[]>([]);
  const [testimonials, setTestimonials] = useState<{ name: string; text: string }[]>([]);
  const [days, setDays] = useState<DayRanges>(() => toDayRanges(defaultWindows()));
  const [duration, setDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState(false);
  const [durationText, setDurationText] = useState('30');
  const [timezone, setTimezone] = useState(deviceTimezone());
  const [isFree, setIsFree] = useState(false);
  const [mrpText, setMrpText] = useState('');
  const [priceText, setPriceText] = useState('');

  const [feePercent, setFeePercent] = useState(0);
  const [paymentsEnabled, setPaymentsEnabled] = useState(true);
  const [google, setGoogle] = useState<MeetGoogleStatus | null>(null);

  const hydrate = useCallback((s: MeetService) => {
    setTitle(s.title);
    setDescription(s.description);
    setInsights(s.insights);
    setTestimonials(s.testimonials);
    setDays(s.windows.length ? toDayRanges(s.windows) : toDayRanges(defaultWindows()));
    setDuration(s.durationMinutes);
    setCustomDuration(!DURATION_PRESETS.includes(s.durationMinutes));
    setDurationText(String(s.durationMinutes));
    setTimezone(s.timezone);
    setIsFree(s.price === 0 && s.mrp === 0);
    setMrpText(s.mrp > 0 ? String(s.mrp) : '');
    setPriceText(s.price > 0 ? String(s.price) : '');
    setSaved(s);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [overview, existing] = await Promise.all([
          meetsApi.overview(),
          editingId ? meetsApi.get(editingId) : Promise.resolve(null),
        ]);
        if (!alive) return;
        setFeePercent(overview.platformFeePercent);
        setPaymentsEnabled(overview.paymentsEnabled);
        setGoogle(overview.google);
        if (existing) hydrate(existing.service);
      } catch (e) {
        if (!alive) return;
        showKollabToast(e instanceof Error ? e.message : 'Could not load this meet');
        if (editingId) router.back();
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [editingId, hydrate, router]);

  const mrp = isFree ? 0 : parseMoney(mrpText);
  const price = isFree ? 0 : parseMoney(priceText);
  const effectiveDuration = customDuration ? Number(durationText) : duration;
  const windows = useMemo(() => toWindows(days), [days]);

  const problemFor = (s: Step): string | null => {
    if (s === 0) {
      if (!title.trim()) return 'Give your meet a clear title';
      if (!description.trim()) return 'Add a description so people know what the meet is about';
      if (insights.some((i) => !i.trim())) return 'Fill in or remove the empty insight';
      if (testimonials.some((t) => !t.name.trim() || !t.text.trim()))
        return 'Fill in or remove the incomplete testimonial';
      return null;
    }
    if (s === 1)
      return durationProblem(effectiveDuration) ?? windowsProblem(windows, effectiveDuration);
    if (s === 2) {
      if (!isFree && mrp <= 0) return 'Enter the original price, or choose Free';
      if (!isFree && price <= 0) return 'Enter a selling price, or choose Free';
      if (!isFree && !paymentsEnabled)
        return 'Online payments are not enabled on this server yet. Choose Free for now.';
      return priceProblem(mrp, price);
    }
    return null;
  };

  const save = async (): Promise<MeetService | null> => {
    const body = {
      title: title.trim(),
      description: description.trim(),
      insights: insights.map((i) => i.trim()),
      testimonials: testimonials.map((t) => ({ name: t.name.trim(), text: t.text.trim() })),
      durationMinutes: effectiveDuration,
      mrp,
      price,
      timezone,
      windows,
    };
    const res = serviceId ? await meetsApi.update(serviceId, body) : await meetsApi.create(body);
    setServiceId(res.service.id);
    setSaved(res.service);
    return res.service;
  };

  const next = async () => {
    const problem = problemFor(step);
    if (problem) {
      showKollabToast(problem);
      return;
    }
    if (step < 2) {
      setStep((step + 1) as Step);
      return;
    }
    if (step === 2) {
      setBusy(true);
      try {
        await save();
        setStep(3);
      } catch (e) {
        showKollabToast(e instanceof Error ? e.message : 'Could not save your meet');
      } finally {
        setBusy(false);
      }
    }
  };

  const goBack = () => {
    if (step === 0) router.back();
    else setStep((step - 1) as Step);
  };

  const publish = async () => {
    if (!serviceId) return;
    setBusy(true);
    try {
      const res =
        saved?.status === 'published' ? { service: saved } : await meetsApi.publish(serviceId);
      setSaved(res.service);
      showKollabToast('Your meet is live');
    } catch (e) {
      showKollabToast(e instanceof Error ? e.message : 'Could not publish your meet');
    } finally {
      setBusy(false);
    }
  };

  const link = saved?.url ?? '';
  const live = saved?.status === 'published';
  const copy = async () => {
    try {
      await Clipboard.setStringAsync(link);
      showKollabToast('Link copied');
    } catch {
      showKollabToast('Could not copy the link');
    }
  };
  const share = async () => {
    try {
      await Share.share({
        message: meetShareText({
          title: saved?.title ?? title,
          durationMinutes: effectiveDuration,
          priceLabel: isFree ? 'Free' : formatInr(price),
          url: link,
        }),
      });
    } catch {
      showKollabToast('Could not open the share sheet');
    }
  };

  // ── availability helpers ──
  const setDay = (weekday: number, ranges: Range[]) =>
    setDays((d) => ({ ...d, [weekday]: ranges }));
  const toggleDay = (weekday: number, on: boolean) =>
    setDay(weekday, on ? [{ start: 540, end: 1020 }] : []);
  const addRange = (weekday: number) => {
    const ranges = days[weekday] ?? [];
    const lastEnd = ranges.length ? ranges[ranges.length - 1].end : 540;
    if (lastEnd >= 1380) {
      showKollabToast('No room left in this day for another range');
      return;
    }
    setDay(weekday, [...ranges, { start: lastEnd, end: Math.min(lastEnd + 60, 1440) }]);
  };
  const patchRange = (weekday: number, index: number, patch: Partial<Range>) =>
    setDay(
      weekday,
      (days[weekday] ?? []).map((r, i) => (i === index ? { ...r, ...patch } : r))
    );
  const dropRange = (weekday: number, index: number) =>
    setDay(
      weekday,
      (days[weekday] ?? []).filter((_, i) => i !== index)
    );

  const [timePick, setTimePick] = useState<{
    weekday: number;
    index: number;
    which: 'start' | 'end';
  } | null>(null);
  const pickedRange = timePick ? (days[timePick.weekday] ?? [])[timePick.index] : undefined;
  const applyPickedTime = (minute: number) => {
    if (!timePick || !pickedRange) return;
    const { weekday, index, which } = timePick;
    if (which === 'start') {
      // Moving the start past the end pushes the end an hour after it, so the range never becomes invalid.
      const end = minute >= pickedRange.end ? Math.min(minute + 60, 1440) : pickedRange.end;
      if (minute >= 1440 - 5) {
        showKollabToast('Start earlier than 11:55 PM');
        return;
      }
      patchRange(weekday, index, { start: minute, end });
    } else {
      if (minute <= pickedRange.start) {
        showKollabToast('The end time must be after the start time');
        return;
      }
      patchRange(weekday, index, { end: minute });
    }
  };

  if (loading) {
    return (
      <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']}>
        <KollabScreenHeader title="Meet" />
        <ActivityIndicator color={c.ink} style={{ marginTop: 32 }} />
      </ScrollScreen>
    );
  }

  const headings = ['Meet details', 'Meet availability', 'Meet pricing', 'Preview and share'];
  const discount = discountLabel(mrp, price);

  const footer =
    step < 3 ? (
      <View style={styles.footer}>
        <KollabButton
          label={step === 2 ? 'Save and preview' : 'Continue'}
          variant="primary"
          onPress={() => void next()}
          loading={busy}
        />
        <Text style={[styles.footNote, { color: c.ink }]}>You can edit this later anytime</Text>
      </View>
    ) : (
      <View style={styles.footer}>
        {live ? (
          <KollabButton
            label="Done"
            variant="primary"
            onPress={() => router.replace('/account-screens/meets' as never)}
          />
        ) : (
          <KollabButton
            label="Get link"
            variant="primary"
            onPress={() => void publish()}
            loading={busy}
          />
        )}
      </View>
    );

  return (
    <ScrollScreen safeAreaEdges={['top', 'left', 'right', 'bottom']} footer={footer}>
      <KollabScreenHeader title={headings[step]} onBack={goBack} />

      <View style={styles.stepper}>
        {STEPS.map((s, i) => {
          const done = i <= step;
          return (
            <React.Fragment key={s.title}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    { backgroundColor: done ? c.violetDeep : c.card, borderColor: c.outline },
                  ]}
                >
                  <Ionicons name={s.icon} size={18} color={done ? '#fff' : c.ink} />
                </View>
                {done ? (
                  <Text style={[styles.stepLabel, { color: c.violetDeep }]}>{s.title}</Text>
                ) : null}
              </View>
              {i < STEPS.length - 1 ? (
                <View style={[styles.stepLine, { backgroundColor: c.outline }]} />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>

      {step === 0 ? (
        <View style={styles.section}>
          <Text style={[styles.h1, { color: c.ink }]}>Create your meet service</Text>
          <Text style={[styles.sub, { color: c.ink }]}>
            Tell people what this meet is about and how you can help.
          </Text>

          <Field label="Meet title" required count={`${title.length}/60`}>
            <KollabTextField
              value={title}
              onChangeText={setTitle}
              maxLength={60}
              placeholder="Give your meet a clear and engaging title."
            />
          </Field>
          <Field label="Description" required count={`${description.length}/500`}>
            <KollabTextField
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              multiline
              placeholder="Explain what you'll talk about and how you'll help them."
            />
          </Field>

          <Group title="Insights" hint="Add key takeaways or areas where you can help. (max 10)">
            {insights.map((value, i) => (
              <View key={i} style={styles.inline}>
                <KollabTextField
                  style={styles.flex}
                  value={value}
                  maxLength={200}
                  onChangeText={(t) => setInsights((l) => l.map((x, j) => (j === i ? t : x)))}
                  placeholder="e.g. Portfolio review"
                />
                <Pressable
                  onPress={() => setInsights((l) => l.filter((_, j) => j !== i))}
                  accessibilityRole="button"
                  accessibilityLabel="Remove insight"
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={24} color={c.ink} style={{ opacity: 0.5 }} />
                </Pressable>
              </View>
            ))}
            {insights.length < 10 ? (
              <AddRow label="Add insight" onPress={() => setInsights((l) => [...l, ''])} />
            ) : null}
          </Group>

          <Group title="Testimonials" hint="What others say about your meet. (max 5)">
            {testimonials.map((t, i) => (
              <View key={i} style={styles.testimonial}>
                <View style={styles.inline}>
                  <KollabTextField
                    style={styles.flex}
                    value={t.name}
                    maxLength={80}
                    onChangeText={(v) =>
                      setTestimonials((l) => l.map((x, j) => (j === i ? { ...x, name: v } : x)))
                    }
                    placeholder="Name"
                  />
                  <Pressable
                    onPress={() => setTestimonials((l) => l.filter((_, j) => j !== i))}
                    accessibilityRole="button"
                    accessibilityLabel="Remove testimonial"
                    hitSlop={8}
                  >
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={c.ink}
                      style={{ opacity: 0.5 }}
                    />
                  </Pressable>
                </View>
                <KollabTextField
                  value={t.text}
                  maxLength={300}
                  multiline
                  onChangeText={(v) =>
                    setTestimonials((l) => l.map((x, j) => (j === i ? { ...x, text: v } : x)))
                  }
                  placeholder="What they said"
                />
              </View>
            ))}
            {testimonials.length < 5 ? (
              <AddRow
                label="Add testimonial"
                onPress={() => setTestimonials((l) => [...l, { name: '', text: '' }])}
              />
            ) : null}
          </Group>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.section}>
          <Text style={[styles.h1, { color: c.ink }]}>Set your availability</Text>
          <Text style={[styles.sub, { color: c.ink }]}>
            Choose the days and times your audience can book. Slots are offered up to 30 days ahead.
          </Text>
          <View style={[styles.note, { backgroundColor: c.well }]}>
            <Ionicons name="information-circle" size={20} color={c.violetDeep} />
            <Text style={[styles.noteText, { color: c.ink }]}>
              Times are in {timezone}. Bookers see them in their own time zone.
            </Text>
          </View>

          {WEEK.map((weekday) => {
            const ranges = days[weekday] ?? [];
            const on = ranges.length > 0;
            return (
              <View
                key={weekday}
                style={[styles.dayCard, { backgroundColor: c.card, borderColor: c.outline }]}
              >
                <View style={styles.dayHead}>
                  <Switch
                    value={on}
                    onValueChange={(v) => toggleDay(weekday, v)}
                    trackColor={{ true: c.violetDeep }}
                    accessibilityLabel={`${WEEKDAY_NAMES[weekday]} available`}
                  />
                  <Text style={[styles.dayName, { color: c.ink }]}>{WEEKDAY_NAMES[weekday]}</Text>
                </View>
                {ranges.map((r, i) => (
                  <View key={i} style={styles.rangeRow}>
                    <TimeButton
                      label={minuteLabel(r.start)}
                      accessibilityLabel={`${WEEKDAY_NAMES[weekday]} start time ${minuteLabel(r.start)}`}
                      onPress={() => setTimePick({ weekday, index: i, which: 'start' })}
                    />
                    <Text style={[styles.dash, { color: c.ink }]}>–</Text>
                    <TimeButton
                      label={minuteLabel(r.end)}
                      accessibilityLabel={`${WEEKDAY_NAMES[weekday]} end time ${minuteLabel(r.end)}`}
                      onPress={() => setTimePick({ weekday, index: i, which: 'end' })}
                    />
                    {i === 0 ? (
                      <Pressable
                        onPress={() =>
                          ranges.length < MAX_RANGES_PER_DAY
                            ? addRange(weekday)
                            : showKollabToast(`At most ${MAX_RANGES_PER_DAY} ranges per day`)
                        }
                        accessibilityRole="button"
                        accessibilityLabel="Add another time range"
                        hitSlop={8}
                      >
                        <Ionicons name="add-circle-outline" size={26} color={c.violetDeep} />
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => dropRange(weekday, i)}
                        accessibilityRole="button"
                        accessibilityLabel="Remove time range"
                        hitSlop={8}
                      >
                        <Ionicons
                          name="remove-circle-outline"
                          size={26}
                          color={c.ink}
                          style={{ opacity: 0.5 }}
                        />
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            );
          })}

          <Text style={[styles.groupTitle, { color: c.ink }]}>Duration</Text>
          <View style={styles.chips}>
            {DURATION_PRESETS.map((m) => {
              const active = !customDuration && duration === m;
              return (
                <Chip
                  key={m}
                  label={`${m} min`}
                  active={active}
                  onPress={() => {
                    setCustomDuration(false);
                    setDuration(m);
                  }}
                />
              );
            })}
            <Chip label="Custom" active={customDuration} onPress={() => setCustomDuration(true)} />
          </View>
          {customDuration ? (
            <KollabTextField
              value={durationText}
              onChangeText={(t) => setDurationText(t.replace(/\D/g, '').slice(0, 3))}
              keyboardType="number-pad"
              placeholder="Minutes (15 to 240, multiple of 5)"
            />
          ) : null}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.section}>
          <Text style={[styles.h1, { color: c.ink }]}>Set the price for this slot</Text>
          <Text style={[styles.sub, { color: c.ink }]}>
            Set the original price, and a lower selling price to show a discount.
          </Text>

          <View style={[styles.summary, { backgroundColor: c.card }, kollab.shadow.card]}>
            <Ionicons name="calendar" size={22} color={c.violetDeep} />
            <View style={styles.flex}>
              <Text style={[styles.summaryTitle, { color: c.ink }]} numberOfLines={1}>
                {title.trim() || 'Your meet'}
              </Text>
              <Text style={[styles.summarySub, { color: c.ink }]}>
                Duration: {effectiveDuration} min
              </Text>
            </View>
          </View>

          <View style={[styles.dayHead, { marginTop: 4 }]}>
            <Switch
              value={isFree}
              onValueChange={setIsFree}
              trackColor={{ true: c.violetDeep }}
              accessibilityLabel="Free session"
            />
            <Text style={[styles.dayName, { color: c.ink }]}>This session is free</Text>
          </View>

          {!isFree ? (
            <>
              <View style={styles.inline}>
                <View style={styles.flex}>
                  <Text style={[styles.fieldLabel, { color: c.ink }]}>
                    Original price<Text style={{ color: '#EF4444' }}> *</Text>
                  </Text>
                  <KollabTextField
                    value={mrpText}
                    onChangeText={(t) => setMrpText(t.replace(/[^\d.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="₹ 000"
                  />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.fieldLabel, { color: c.ink }]}>
                    Selling price<Text style={{ color: '#EF4444' }}> *</Text>
                  </Text>
                  <KollabTextField
                    value={priceText}
                    onChangeText={(t) => setPriceText(t.replace(/[^\d.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="₹ 000"
                  />
                </View>
              </View>
              {price > 0 ? (
                <Text style={[styles.sub, { color: c.ink }]}>
                  {feePercent > 0
                    ? `After the ${feePercent}% platform fee you receive ${formatInr(Math.round(price * (100 - feePercent)) / 100)} per session.`
                    : `You receive ${formatInr(price)} per session.`}
                </Text>
              ) : null}
              {!paymentsEnabled ? (
                <Text style={[styles.warn, { color: c.violetDeep }]}>
                  Online payments are not enabled on this server yet, so paid meets cannot be
                  published.
                </Text>
              ) : null}
            </>
          ) : null}

          <View style={[styles.preview, { backgroundColor: c.well }]}>
            <Text style={[styles.fieldLabel, { color: c.ink }]}>Preview</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: c.ink }]}>
                {isFree ? 'Free' : price > 0 ? formatInr(price) : '—'}
              </Text>
              {!isFree && mrp > price ? (
                <Text style={[styles.mrp, { color: c.ink }]}>{formatInr(mrp)}</Text>
              ) : null}
              {discount ? <Text style={[styles.off, { color: c.teal }]}>{discount}</Text> : null}
            </View>
          </View>
        </View>
      ) : null}

      <TimePickerSheet
        visible={timePick !== null}
        title={timePick?.which === 'end' ? 'End time' : 'Start time'}
        minute={
          timePick && pickedRange
            ? timePick.which === 'start'
              ? pickedRange.start
              : pickedRange.end
            : 540
        }
        endOfDay={timePick?.which === 'end'}
        onClose={() => setTimePick(null)}
        onConfirm={applyPickedTime}
      />

      {step === 3 ? (
        <View style={styles.section}>
          <Text style={[styles.h1, { color: c.ink }]}>Booking page preview</Text>
          <Text style={[styles.sub, { color: c.ink }]}>
            This is how your meet service will appear to others.
          </Text>

          {saved ? (
            <View style={[styles.previewCard, { backgroundColor: c.card }, kollab.shadow.card]}>
              <View style={styles.cardTop}>
                <Text style={[styles.summaryTitle, { color: c.ink }]}>1:1 Meet</Text>
                <Pressable
                  onPress={() => setStep(0)}
                  accessibilityRole="button"
                  accessibilityLabel="Edit meet details"
                >
                  <Text style={[styles.edit, { color: c.violetDeep }]}>Edit</Text>
                </Pressable>
              </View>
              <View style={[styles.inner, { backgroundColor: c.well }]}>
                <Ionicons name="videocam" size={26} color={c.violetDeep} />
                <View style={styles.flex}>
                  <Text style={[styles.summaryTitle, { color: c.ink }]}>{saved.title}</Text>
                  <Text style={[styles.summarySub, { color: c.ink }]} numberOfLines={2}>
                    {saved.description}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: c.ink }]}>
                      {saved.isFree ? 'Free' : formatInr(saved.price)}
                    </Text>
                    {saved.mrp > saved.price ? (
                      <Text style={[styles.mrp, { color: c.ink }]}>{formatInr(saved.mrp)}</Text>
                    ) : null}
                    <Text style={[styles.summarySub, { color: c.ink }]}>
                      · {saved.durationMinutes} min
                    </Text>
                  </View>
                </View>
              </View>
              {saved.insights.length ? (
                <View style={{ gap: 4 }}>
                  <Text style={[styles.groupTitle, { color: c.ink }]}>What we will cover</Text>
                  {saved.insights.map((i, n) => (
                    <Text key={n} style={[styles.summarySub, { color: c.ink }]}>
                      • {i}
                    </Text>
                  ))}
                </View>
              ) : null}
              <View style={{ gap: 4 }}>
                <Text style={[styles.groupTitle, { color: c.ink }]}>About this session</Text>
                <Text style={[styles.summarySub, { color: c.ink }]}>{saved.description}</Text>
              </View>
            </View>
          ) : null}

          {live ? (
            <View style={[styles.linkBox, { backgroundColor: c.well }]}>
              <Text style={[styles.fieldLabel, { color: c.ink }]}>Your booking link</Text>
              <Text style={[styles.link, { color: c.violetDeep }]} selectable>
                {link}
              </Text>
              <View style={styles.inline}>
                <KollabButton
                  label="Copy"
                  variant="soft"
                  compact
                  onPress={() => void copy()}
                  style={styles.flex}
                />
                <KollabButton
                  label="Share"
                  variant="soft"
                  compact
                  onPress={() => void share()}
                  style={styles.flex}
                />
                <KollabButton
                  label="Open"
                  variant="hairline"
                  compact
                  onPress={() =>
                    void openExternalUrl(link).catch(() =>
                      showKollabToast('Could not open the link')
                    )
                  }
                  style={styles.flex}
                />
              </View>
            </View>
          ) : (
            <Text style={[styles.sub, { color: c.ink }]}>
              Tap Get link to publish your meet and share it.
            </Text>
          )}

          {google ? <GoogleConnectCard status={google} onChange={setGoogle} /> : null}
        </View>
      ) : null}
    </ScrollScreen>
  );
}

function Field({
  label,
  required,
  count,
  children,
}: {
  label: string;
  required?: boolean;
  count?: string;
  children: React.ReactNode;
}) {
  const kollab = useKollab();
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.fieldHead}>
        <Text style={[styles.fieldLabel, { color: kollab.color.ink }]}>
          {label}
          {required ? <Text style={{ color: '#EF4444' }}> *</Text> : null}
        </Text>
        {count ? <Text style={[styles.count, { color: kollab.color.ink }]}>{count}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  const kollab = useKollab();
  return (
    <View
      style={[
        styles.group,
        { backgroundColor: kollab.color.card, borderColor: kollab.color.outline },
      ]}
    >
      <Text style={[styles.groupTitle, { color: kollab.color.ink }]}>
        {title} <Text style={styles.optional}>(optional)</Text>
      </Text>
      <Text style={[styles.summarySub, { color: kollab.color.ink }]}>{hint}</Text>
      {children}
    </View>
  );
}

function AddRow({ label, onPress }: { label: string; onPress: () => void }) {
  const kollab = useKollab();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.add, { borderColor: kollab.color.outline }]}
    >
      <Ionicons name="add" size={22} color={kollab.color.violetDeep} />
      <Text style={[styles.addText, { color: kollab.color.violetDeep }]}>{label}</Text>
    </Pressable>
  );
}

/** A tappable time pill that opens the wheel picker. */
function TimeButton({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const kollab = useKollab();
  const c = kollab.color;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.timeBtn, { backgroundColor: c.well, borderColor: c.outline }]}
    >
      <Ionicons name="time-outline" size={16} color={c.violetDeep} />
      <Text style={[styles.timeText, { color: c.ink }]}>{label}</Text>
    </Pressable>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const kollab = useKollab();
  const c = kollab.color;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        {
          backgroundColor: active ? c.well : c.card,
          borderColor: active ? c.violetDeep : c.outline,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? c.violetDeep : c.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  footNote: { fontFamily: font.body, fontSize: 12.5, opacity: 0.5, textAlign: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 10 },
  stepItem: { alignItems: 'center', gap: 4, minWidth: 52 },
  stepDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { fontFamily: font.bold, fontSize: 11 },
  stepLine: { flex: 1, height: 2, marginTop: 18 },
  section: { gap: 14, paddingBottom: 12 },
  h1: { fontFamily: font.display, fontSize: 26, lineHeight: 30 },
  sub: { fontFamily: font.body, fontSize: 14, opacity: 0.6, lineHeight: 20 },
  fieldHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  fieldLabel: { fontFamily: font.bold, fontSize: 14.5 },
  count: { fontFamily: font.body, fontSize: 12, opacity: 0.5 },
  group: { borderRadius: 20, borderWidth: 1, padding: 14, gap: 10 },
  groupTitle: { fontFamily: font.bold, fontSize: 16 },
  optional: { fontFamily: font.body, fontSize: 14, opacity: 0.6 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  testimonial: { gap: 8 },
  add: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  addText: { fontFamily: font.bold, fontSize: 14.5 },
  note: { flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 16, padding: 12 },
  noteText: { flex: 1, fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  dayCard: { borderRadius: 18, borderWidth: 1, padding: 12, gap: 10 },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayName: { fontFamily: font.bold, fontSize: 15.5 },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dash: { fontFamily: font.bold, fontSize: 16 },
  timeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  timeText: { fontFamily: font.bold, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderRadius: 18, borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 18 },
  chipText: { fontFamily: font.bold, fontSize: 14 },
  summary: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 20, padding: 14 },
  summaryTitle: { fontFamily: font.bold, fontSize: 16 },
  summarySub: { fontFamily: font.body, fontSize: 13.5, opacity: 0.65, lineHeight: 19 },
  warn: { fontFamily: font.bold, fontSize: 13 },
  preview: { borderRadius: 18, padding: 14, gap: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  price: { fontFamily: font.bold, fontSize: 20 },
  mrp: { fontFamily: font.body, fontSize: 14, opacity: 0.45, textDecorationLine: 'line-through' },
  off: { fontFamily: font.bold, fontSize: 13 },
  previewCard: { borderRadius: 22, padding: 16, gap: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  edit: { fontFamily: font.bold, fontSize: 14.5 },
  inner: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 18, padding: 14 },
  linkBox: { borderRadius: 20, padding: 14, gap: 10 },
  link: { fontFamily: font.bold, fontSize: 14 },
});
