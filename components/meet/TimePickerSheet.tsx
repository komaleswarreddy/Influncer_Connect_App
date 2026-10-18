import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KollabButton, PremiumCard } from '@/components/ui';
import { WheelColumn } from '@/components/scheduler/ScheduleDateTimeSheet';
import { spacing, radius } from '@/theme';
import { fonts } from '@/components/ui/typography';
import { minuteLabel } from '@/lib/meets-ui';

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as const;
const PERIODS = ['AM', 'PM'] as const;
type Period = (typeof PERIODS)[number];

/** Minutes from midnight to the three wheel values. 1440 (end of day) reads as 12:00 AM. */
function toWheels(minute: number): { hour: number; minute: number; period: Period } {
  const m = ((minute % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const nearest = MINUTES.reduce((a, b) =>
    Math.abs(b - (m % 60)) < Math.abs(a - (m % 60)) ? b : a
  );
  return { hour: h24 % 12 === 0 ? 12 : h24 % 12, minute: nearest, period: h24 >= 12 ? 'PM' : 'AM' };
}

function fromWheels(hour: number, minute: number, period: Period): number {
  const h24 = period === 'AM' ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12;
  return h24 * 60 + minute;
}

type Props = {
  visible: boolean;
  title: string;
  /** Minutes from midnight, 0..1440. */
  minute: number;
  /** When true, picking 12:00 AM means the end of the day (1440), not the start (0). */
  endOfDay?: boolean;
  onClose: () => void;
  onConfirm: (minute: number) => void;
};

/** Wheel time picker (hour, minute, AM/PM) that matches the date and time sheet used by the scheduler. */
export function TimePickerSheet({
  visible,
  title,
  minute,
  endOfDay = false,
  onClose,
  onConfirm,
}: Props) {
  const initial = toWheels(minute);
  const [hour, setHour] = useState<number>(initial.hour);
  const [min, setMin] = useState<number>(initial.minute);
  const [period, setPeriod] = useState<Period>(initial.period);

  useEffect(() => {
    if (!visible) return;
    const w = toWheels(minute);
    setHour(w.hour);
    setMin(w.minute);
    setPeriod(w.period);
  }, [visible, minute]);

  const chosen = fromWheels(hour, min, period);
  const result = endOfDay && chosen === 0 ? 1440 : chosen;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTap}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Close"
        />
        <PremiumCard style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.preview} accessibilityLiveRegion="polite">
            {minuteLabel(result)}
          </Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Hour</Text>
              <WheelColumn
                items={HOURS}
                selected={hour as (typeof HOURS)[number]}
                onChange={setHour}
                formatLabel={(h) => String(h)}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Min</Text>
              <WheelColumn
                items={MINUTES}
                selected={min as (typeof MINUTES)[number]}
                onChange={setMin}
                formatLabel={(m) => String(m).padStart(2, '0')}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>AM/PM</Text>
              <WheelColumn
                items={PERIODS}
                selected={period}
                onChange={setPeriod}
                formatLabel={(p) => p}
              />
            </View>
          </View>
          <View style={styles.actions}>
            <KollabButton
              label="Cancel"
              variant="soft"
              compact
              onPress={onClose}
              style={styles.action}
            />
            <KollabButton
              label="Confirm"
              compact
              onPress={() => {
                onConfirm(result);
                onClose();
              }}
              style={styles.action}
            />
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
  title: { fontFamily: fonts.bold, fontSize: 18, color: '#171410', textAlign: 'center' },
  preview: { fontFamily: fonts.bold, fontSize: 30, color: '#171410', textAlign: 'center' },
  row: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  col: { flex: 1 },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: 'rgba(23,20,16,0.45)',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  action: { flex: 1 },
});
