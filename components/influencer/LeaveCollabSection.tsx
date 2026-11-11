import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { api } from '@/lib/api';
import { useKollab, font, space } from '@/theme/kollab-tokens';
import { showKollabToast } from '@/components/ui';
import { ReasonSheet, type ReasonOption } from '@/components/influencer/ReasonSheet';

/** Same list as the API (server/services/collab-withdraw-rules.ts). */
const REASONS: ReasonOption[] = [
  { key: 'not_interested', label: 'No longer interested' },
  { key: 'schedule_conflict', label: 'Schedule conflict' },
  { key: 'brief_changed', label: 'The brief changed' },
  { key: 'other', label: 'Other' },
];

type Props = {
  participationId: string;
  /** Anything submitted for this collab, rejected or not: after that the brand has to be contacted. */
  hasSubmissions: boolean;
  /** Called after the creator has left, so the screen can refresh and go back. */
  onLeft: () => void;
};

/**
 * "Leave collab" at the bottom of Collab progress. Allowed until content is submitted or money is earned;
 * the API enforces both rules, this screen only explains them.
 */
export function LeaveCollabSection({ participationId, hasSubmissions, onLeft }: Props) {
  const kollab = useKollab();
  const [open, setOpen] = useState(false);

  const confirm = async (reason: string, note: string) => {
    // A failure throws, and the sheet shows the message inside itself.
    await api.post(`/api/campaigns/participation/${participationId}/withdraw`, {
      reason,
      note: note || undefined,
    });
    setOpen(false);
    showKollabToast('You left this collab. The brand has been told.');
    onLeft();
  };

  if (hasSubmissions) {
    return (
      <View style={styles.wrap}>
        <Text style={[styles.hint, { color: kollab.color.inkMuted }]}>
          Want to leave this collab? You have already submitted content, so please contact the brand.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Leave collab"
        style={({ pressed }) => [
          styles.leaveButton,
          { borderColor: kollab.color.heat, backgroundColor: kollab.color.heatTint },
          pressed ? { opacity: 0.7 } : null,
        ]}
      >
        <Text style={[styles.leaveButtonText, { color: kollab.color.heat }]}>Leave collab</Text>
      </Pressable>
      <Text style={[styles.hint, { color: kollab.color.inkMuted }]}>You can leave until you submit content.</Text>

      <ReasonSheet
        visible={open}
        title="Leave this collab?"
        message="Your tracking links and promo codes stop working right away, and the brand is told. You can only come back if the brand invites you again."
        reasons={REASONS}
        confirmLabel="Leave collab"
        cancelLabel="Stay in collab"
        onConfirm={confirm}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'stretch', paddingVertical: space.md, paddingHorizontal: 22, marginTop: 8 },
  leaveButton: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveButtonText: { fontFamily: font.semiBold, fontSize: 15 },
  hint: { fontFamily: font.body, fontSize: 12.5, textAlign: 'center', marginTop: 8 },
});
