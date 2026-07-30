import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PremiumCard, PrimaryButton, SecondaryButton } from '@/components/ui';
import { appShell, spacing, radius } from '@/theme';
import { fonts } from '@/components/ui/typography';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const PERIODS = ['AM', 'PM'] as const;

const WHEEL_ITEM_HEIGHT = 40;
const WHEEL_VISIBLE_ROWS = 3;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS;

export type ScheduleDateTimeValue = {
  date: Date;
  hour24: number;
  minute: number;
};

type Props = {
  visible: boolean;
  value: ScheduleDateTimeValue;
  onClose: () => void;
  onConfirm: (value: ScheduleDateTimeValue) => void;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function to12Hour(hour24: number): { hour12: number; period: 'AM' | 'PM' } {
  const period = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, period };
}

function to24Hour(hour12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

function nearestMinute(minute: number): number {
  return MINUTES.reduce((prev, curr) =>
    Math.abs(curr - minute) < Math.abs(prev - minute) ? curr : prev
  );
}

export function scheduleValueToDate(value: ScheduleDateTimeValue): Date {
  const d = startOfDay(value.date);
  d.setHours(value.hour24, value.minute, 0, 0);
  return d;
}

export function dateToScheduleValue(d: Date): ScheduleDateTimeValue {
  return {
    date: startOfDay(d),
    hour24: d.getHours(),
    minute: nearestMinute(d.getMinutes()),
  };
}

export function formatScheduleWhen(value: ScheduleDateTimeValue, tz?: string): string {
  const when = scheduleValueToDate(value);
  try {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(when);
  } catch {
    return when.toLocaleString();
  }
}

type WheelColumnProps<T extends string | number> = {
  items: readonly T[];
  selected: T;
  onChange: (value: T) => void;
  formatLabel: (value: T) => string;
};

function WheelColumn<T extends string | number>({
  items,
  selected,
  onChange,
  formatLabel,
}: WheelColumnProps<T>) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = Math.max(0, items.indexOf(selected));
  const pad = Math.floor(WHEEL_VISIBLE_ROWS / 2);

  useEffect(() => {
    const y = selectedIndex * WHEEL_ITEM_HEIGHT;
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: false });
    });
    return () => cancelAnimationFrame(id);
  }, [selectedIndex]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.min(items.length - 1, Math.max(0, Math.round(y / WHEEL_ITEM_HEIGHT)));
    const next = items[index];
    if (next !== undefined && next !== selected) onChange(next);
    scrollRef.current?.scrollTo({ y: index * WHEEL_ITEM_HEIGHT, animated: true });
  };

  return (
    <View style={styles.wheelFrame}>
      <View style={styles.wheelHighlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        style={styles.wheelScroll}
        contentContainerStyle={{
          paddingVertical: pad * WHEEL_ITEM_HEIGHT,
        }}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onMomentumEnd}
      >
        {items.map((item) => {
          const active = item === selected;
          return (
            <TouchableOpacity
              key={String(item)}
              style={styles.wheelItem}
              activeOpacity={0.7}
              onPress={() => {
                onChange(item);
                const index = items.indexOf(item);
                scrollRef.current?.scrollTo({
                  y: Math.max(0, index) * WHEEL_ITEM_HEIGHT,
                  animated: true,
                });
              }}
            >
              <Text style={[styles.wheelItemText, active && styles.wheelItemTextActive]}>
                {formatLabel(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function ScheduleDateTimeSheet({ visible, value, onClose, onConfirm }: Props) {
  const [year, setYear] = useState(value.date.getFullYear());
  const [month, setMonth] = useState(value.date.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(value.date.getDate());
  const [pickerHour, setPickerHour] = useState(to12Hour(value.hour24).hour12);
  const [pickerMinute, setPickerMinute] = useState(nearestMinute(value.minute));
  const [pickerPeriod, setPickerPeriod] = useState<'AM' | 'PM'>(to12Hour(value.hour24).period);

  useEffect(() => {
    if (!visible) return;
    setYear(value.date.getFullYear());
    setMonth(value.date.getMonth() + 1);
    setSelectedDay(value.date.getDate());
    const h = to12Hour(value.hour24);
    setPickerHour(h.hour12);
    setPickerPeriod(h.period);
    setPickerMinute(nearestMinute(value.minute));
  }, [visible, value]);

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const firstWeekday = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month]);
  const todayStart = useMemo(() => startOfDay(new Date()), [visible]);

  const cells = useMemo(() => {
    const blanks = Array.from({ length: firstWeekday }, () => null as number | null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return [...blanks, ...days];
  }, [firstWeekday, daysInMonth]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    if (selectedDay > maxDay) setSelectedDay(maxDay);
  };

  const isDayDisabled = (day: number): boolean => {
    const candidate = startOfDay(new Date(year, month - 1, day));
    return candidate.getTime() < todayStart.getTime();
  };

  const handleConfirm = () => {
    const chosen = startOfDay(new Date(year, month - 1, selectedDay));
    onConfirm({
      date: chosen,
      hour24: to24Hour(pickerHour, pickerPeriod),
      minute: pickerMinute,
    });
    onClose();
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTap} activeOpacity={1} onPress={onClose} />
        <PremiumCard style={styles.sheet}>
          <Text style={styles.sheetTitle}>Pick date & time</Text>

          <View style={styles.monthRow}>
            <TouchableOpacity onPress={() => shiftMonth(-1)} hitSlop={8}>
              <Ionicons name="chevron-back-outline" size={22} color={appShell.cta} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => shiftMonth(1)} hitSlop={8}>
              <Ionicons name="chevron-forward-outline" size={22} color={appShell.cta} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={styles.weekday}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, idx) =>
              day === null ? (
                <View key={`blank-${idx}`} style={styles.cell} />
              ) : (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.cell,
                    selectedDay === day && styles.cellSelected,
                    isDayDisabled(day) && styles.cellDisabled,
                  ]}
                  disabled={isDayDisabled(day)}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text
                    style={[
                      styles.cellText,
                      selectedDay === day && styles.cellTextSelected,
                      isDayDisabled(day) && styles.cellTextDisabled,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          <View style={styles.pickerRow}>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Hour</Text>
              <WheelColumn
                items={HOURS}
                selected={pickerHour}
                onChange={setPickerHour}
                formatLabel={(h) => String(h)}
              />
            </View>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>Min</Text>
              <WheelColumn
                items={MINUTES}
                selected={pickerMinute}
                onChange={setPickerMinute}
                formatLabel={(m) => String(m).padStart(2, '0')}
              />
            </View>
            <View style={styles.pickerCol}>
              <Text style={styles.pickerLabel}>AM/PM</Text>
              <WheelColumn
                items={PERIODS}
                selected={pickerPeriod}
                onChange={setPickerPeriod}
                formatLabel={(p) => p}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <SecondaryButton label="Cancel" onPress={onClose} style={styles.actionBtn} />
            <PrimaryButton label="Confirm" onPress={handleConfirm} style={styles.actionBtn} />
          </View>
        </PremiumCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  backdropTap: { flex: 1 },
  sheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: appShell.textPrimary,
    textAlign: 'center',
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { fontFamily: fonts.semiBold, fontSize: 16, color: appShell.textPrimary },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: appShell.textMuted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  cellSelected: { backgroundColor: appShell.cta },
  cellDisabled: { opacity: 0.35 },
  cellText: { fontFamily: fonts.semiBold, fontSize: 14, color: appShell.textPrimary },
  cellTextSelected: { color: '#fff' },
  cellTextDisabled: { color: appShell.textMuted },
  pickerRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  pickerCol: { flex: 1 },
  pickerLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: appShell.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  wheelFrame: {
    height: WHEEL_HEIGHT,
    borderRadius: radius.md,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15, 23, 42, 0.08)',
  },
  wheelHighlight: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: WHEEL_ITEM_HEIGHT,
    height: WHEEL_ITEM_HEIGHT,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    zIndex: 1,
  },
  wheelScroll: {
    height: WHEEL_HEIGHT,
    zIndex: 2,
  },
  wheelItem: {
    height: WHEEL_ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: appShell.textMuted,
  },
  wheelItemTextActive: {
    color: appShell.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { flex: 1 },
});
