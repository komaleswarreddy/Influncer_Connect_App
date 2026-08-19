import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useKollab, font, choiceChipColors } from '@/theme/kollab-tokens';

export type KollabSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  value: string | null;
  placeholder?: string;
  options: KollabSelectOption[];
  onChange: (value: string) => void;
  accessibilityLabel?: string;
  /** Expand options in-place (no overlay). Use for short lists like profile niche. */
  inline?: boolean;
};

/** Pill select that matches KollabTextField. Opens a Kollab option sheet. */
export function KollabSelect({
  value,
  placeholder = 'Select',
  options,
  onChange,
  accessibilityLabel,
  inline = false,
}: Props) {
  const kollab = useKollab();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const display = selected?.label ?? '';

  const optionPills = (
    <View style={inline ? styles.inlineList : styles.optionList}>
      {options.map((opt) => {
        const on = opt.value === value;
        const chip = choiceChipColors(kollab, on);
        return (
          <Pressable
            key={opt.value}
            disabled={opt.disabled}
            onPress={() => {
              onChange(opt.value);
              if (!inline) setOpen(false);
            }}
            style={[
              inline ? styles.inlineOption : styles.option,
              {
                backgroundColor: chip.backgroundColor,
                borderColor: chip.borderColor,
                opacity: opt.disabled ? 0.4 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: on, disabled: Boolean(opt.disabled) }}
            accessibilityLabel={opt.label}
          >
            <Text
              style={[
                inline ? styles.inlineOptionLabel : styles.optionLabel,
                { color: chip.color },
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (inline) {
    return <View accessibilityLabel={accessibilityLabel ?? placeholder}>{optionPills}</View>;
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            backgroundColor: kollab.color.card,
            borderColor: kollab.color.outline,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? placeholder}
      >
        <Text
          style={[styles.fieldText, { color: display ? kollab.color.ink : kollab.color.inkFaint }]}
          numberOfLines={1}
        >
          {display || placeholder}
        </Text>
        <Text style={[styles.caret, { color: kollab.color.inkMuted }]}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable
            style={[styles.dim, { backgroundColor: 'rgba(15,13,11,0.45)' }]}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: kollab.color.card,
                borderColor: kollab.color.outline,
              },
            ]}
          >
            <Text style={[styles.sheetTitle, { color: kollab.color.ink }]}>{placeholder}</Text>
            {optionPills}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 50,
  },
  fieldText: {
    flex: 1,
    minWidth: 0,
    fontFamily: font.body,
    fontSize: 14,
  },
  caret: {
    fontFamily: font.semiBold,
    fontSize: 14,
    marginLeft: 8,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    marginHorizontal: 14,
    marginBottom: 22,
    borderRadius: 26,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  sheetTitle: {
    fontFamily: font.semiBold,
    fontSize: 13.5,
    marginBottom: 12,
  },
  optionList: {
    gap: 8,
  },
  option: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionLabel: {
    fontFamily: font.semiBold,
    fontSize: 14,
  },
  inlineList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inlineOption: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 9,
    paddingHorizontal: 15,
  },
  inlineOptionLabel: {
    fontFamily: font.semiBold,
    fontSize: 12.5,
  },
});
