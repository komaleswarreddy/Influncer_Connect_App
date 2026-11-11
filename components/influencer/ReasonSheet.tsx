import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, ScrollView } from 'react-native';
import { useKollab, font } from '@/theme/kollab-tokens';
import { KollabButton, KollabTextField } from '@/components/ui';

export type ReasonOption = { key: string; label: string };

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  reasons: ReasonOption[];
  confirmLabel: string;
  cancelLabel?: string;
  /** Resolve to finish; throw an Error to keep the sheet open and show its message inside the sheet. */
  onConfirm: (reason: string, note: string) => Promise<void>;
  onClose: () => void;
};

/**
 * A bottom sheet that asks "why?": pick one reason (required) and add an optional note.
 *
 * Errors are shown INSIDE the sheet. A toast is drawn by the app's own layer, and a Modal sits above that layer, so a
 * toast raised while a sheet is open ends up dimmed behind it.
 */
export function ReasonSheet({
  visible,
  title,
  message,
  reasons,
  confirmLabel,
  cancelLabel = 'Go back',
  onConfirm,
  onClose,
}: Props) {
  const kollab = useKollab();
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setReason(null);
      setNote('');
      setSaving(false);
      setError(null);
    }
  }, [visible]);

  const confirm = async () => {
    if (!reason || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onConfirm(reason, note.trim());
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={saving ? undefined : onClose}>
      {/* No manual keyboard padding here: Android shrinks a Modal's own window when the keyboard opens, so adding the
          keyboard height again squeezed the sheet to a sliver at the top. */}
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: kollab.color.card }]}>
          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.title, { color: kollab.color.ink }]}>{title}</Text>
            {message ? <Text style={[styles.body, { color: kollab.color.inkMuted }]}>{message}</Text> : null}

            <Text style={[styles.label, { color: kollab.color.ink }]}>
              Reason <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            {reasons.map((r) => {
              const selected = reason === r.key;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setReason(r.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[
                    styles.reasonRow,
                    {
                      borderColor: selected ? kollab.color.ink : kollab.color.outline,
                      backgroundColor: selected ? kollab.color.well : 'transparent',
                    },
                  ]}
                >
                  <View style={[styles.radio, { borderColor: selected ? kollab.color.ink : kollab.color.outline }]}>
                    {selected ? <View style={[styles.radioDot, { backgroundColor: kollab.color.ink }]} /> : null}
                  </View>
                  <Text style={[styles.reasonText, { color: kollab.color.ink }]}>{r.label}</Text>
                </Pressable>
              );
            })}

            <Text style={[styles.label, { color: kollab.color.ink }]}>Add a note (optional)</Text>
            <KollabTextField
              value={note}
              onChangeText={setNote}
              placeholder="Anything the brand should know"
              multiline
              maxLength={500}
              surface="well"
            />

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: kollab.color.heatTint }]}>
                <Text style={[styles.errorText, { color: kollab.color.heat }]}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <KollabButton label={cancelLabel} variant="soft" onPress={onClose} disabled={saving} />
              <KollabButton
                label={saving ? 'Please wait…' : confirmLabel}
                variant="ink"
                onPress={() => void confirm()}
                disabled={!reason || saving}
                style={{ marginTop: 10 }}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, maxHeight: '94%' },
  // Lets the list shrink and scroll inside the sheet instead of being clipped when the keyboard takes space.
  scroll: { flexGrow: 0, flexShrink: 1 },
  title: { fontFamily: font.bold, fontSize: 20, marginBottom: 8 },
  body: { fontFamily: font.body, fontSize: 13.5, lineHeight: 19, marginBottom: 6 },
  label: { fontFamily: font.semiBold, fontSize: 13.5, marginTop: 14, marginBottom: 8 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 12,
  },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  reasonText: { fontFamily: font.body, fontSize: 14.5 },
  errorBox: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginTop: 14 },
  errorText: { fontFamily: font.medium, fontSize: 13 },
  actions: { marginTop: 18, marginBottom: 6 },
});
