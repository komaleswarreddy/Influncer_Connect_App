import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { premiumButton, premiumNavy, radius, shadow, spacing, useAppShell } from '@/theme';
import { fonts } from './typography';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  primaryLabel: string;
  onPrimary: () => void;
  onRequestClose?: () => void;
};

/** Centered navy-header action card for decisive success flows (e.g. after apply). */
export function PremiumActionPopover({
  visible,
  title,
  message,
  primaryLabel,
  onPrimary,
  onRequestClose,
}: Props) {
  const shell = useAppShell();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onRequestClose}>
        <Pressable
          style={[styles.card, { backgroundColor: shell.card, borderColor: shell.cardBorder }]}
          onPress={(e) => e.stopPropagation()}
        >
          <LinearGradient
            colors={[...premiumNavy.base.colors]}
            locations={[...premiumNavy.base.locations]}
            start={premiumNavy.base.start}
            end={premiumNavy.base.end}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>{title}</Text>
          </LinearGradient>
          <View style={styles.body}>
            {message ? (
              <Text style={[styles.message, { color: shell.textSecondary }]}>{message}</Text>
            ) : null}
            <PrimaryButton label={primaryLabel} onPress={onPrimary} pill />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 17, 40, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    ...shadow.card,
  },
  header: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: premiumButton.labelColor,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  body: {
    padding: spacing.md,
    gap: spacing.md,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
