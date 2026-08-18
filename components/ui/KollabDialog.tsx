import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { KollabButton, type KollabButtonVariant } from './KollabButton';
import { useKollab, font } from '@/theme/kollab-tokens';

export type KollabDialogAction = {
  id: string;
  label: string;
  variant?: KollabButtonVariant;
};

type DialogPayload = {
  title: string;
  message?: string;
  actions: KollabDialogAction[];
  resolve: (id: string | null) => void;
};

type Listener = (payload: DialogPayload) => void;

const listeners = new Set<Listener>();
const queue: DialogPayload[] = [];
let open: DialogPayload | null = null;

function present(next: DialogPayload) {
  if (open) {
    queue.push(next);
    return;
  }
  open = next;
  listeners.forEach((fn) => fn(next));
}

function finish(id: string | null) {
  const current = open;
  open = null;
  current?.resolve(id);
  const queued = queue.shift();
  if (queued) present(queued);
}

/** Kollab confirm/choice card — replaces native Alert.alert two-button popovers. */
export function showKollabDialog(opts: {
  title: string;
  message?: string;
  actions: KollabDialogAction[];
}): Promise<string | null> {
  return new Promise((resolve) => {
    present({
      title: opts.title,
      message: opts.message,
      actions:
        opts.actions.length > 0 ? opts.actions : [{ id: 'ok', label: 'OK', variant: 'primary' }],
      resolve,
    });
  });
}

export function showKollabConfirm(opts: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}): Promise<boolean> {
  const confirmId = 'confirm';
  return showKollabDialog({
    title: opts.title,
    message: opts.message,
    actions: [
      { id: 'cancel', label: opts.cancelLabel ?? 'Cancel', variant: 'soft' },
      {
        id: confirmId,
        label: opts.confirmLabel ?? 'Confirm',
        variant: opts.destructive ? 'ink' : 'primary',
      },
    ],
  }).then((id) => id === confirmId);
}

export function KollabDialogHost() {
  const kollab = useKollab();
  const [payload, setPayload] = useState<DialogPayload | null>(null);

  const onPayload = useCallback((next: DialogPayload) => {
    setPayload(next);
  }, []);

  useEffect(() => {
    listeners.add(onPayload);
    if (open) setPayload(open);
    return () => {
      listeners.delete(onPayload);
    };
  }, [onPayload]);

  const close = (id: string | null) => {
    setPayload(null);
    finish(id);
  };

  if (!payload) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => close(null)}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => close(null)}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Pressable
          style={[styles.card, { backgroundColor: kollab.color.card }, kollab.shadow.card]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: kollab.color.ink }]}>{payload.title}</Text>
          {payload.message ? (
            <Text style={[styles.message, { color: kollab.color.ink }]}>{payload.message}</Text>
          ) : null}
          <View style={styles.actions}>
            {payload.actions.map((action) => (
              <KollabButton
                key={action.id}
                label={action.label}
                variant={action.variant ?? 'primary'}
                onPress={() => close(action.id)}
              />
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(23,20,16,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: font.display,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.6,
  },
  message: {
    fontFamily: font.body,
    fontSize: 13.5,
    lineHeight: 20,
    opacity: 0.62,
    marginTop: 8,
  },
  actions: {
    marginTop: 18,
    gap: 9,
  },
});
