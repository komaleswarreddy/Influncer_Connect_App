import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useKollab } from '@/theme/kollab-tokens';

export type KollabButtonVariant = 'primary' | 'ink' | 'soft' | 'hairline';

type Props = {
  label: string;
  onPress: () => void;
  variant?: KollabButtonVariant;
  /** Smaller padding/font — the "Ask the AI" / "Share" paired-secondary size in the mockup. */
  compact?: boolean;
  disabled?: boolean;
  /** Shows a spinner in the label colour (always readable on this variant's fill) and blocks presses. */
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Every button is a 999px pill with a solid fill — see kollab-tokens.ts's `button` spec.
 *  `hairline` only ever appears beside a filled primary, never as a standalone CTA. */
export function KollabButton({
  label,
  onPress,
  variant = 'primary',
  compact = false,
  disabled = false,
  loading = false,
  icon,
  style,
}: Props) {
  const kollab = useKollab();
  const spec = kollab.button[variant];
  const isHairline = variant === 'hairline';
  const inactive = disabled || loading;
  // Dark mode: flat muted fill + readable label (see buildButton). Light mode: opacity fade.
  // A loading button keeps its normal colours — only a truly disabled one looks "off".
  const disabledSpec = disabled && !loading ? kollab.button.disabled : null;
  const bg = disabledSpec ? disabledSpec.bg : isHairline ? 'transparent' : spec.bg;
  const fg = disabledSpec ? disabledSpec.fg : spec.fg;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderWidth: disabledSpec ? 1 : isHairline ? kollab.button.hairline.borderWidth : 0,
          borderColor: disabledSpec
            ? disabledSpec.borderColor
            : isHairline
              ? kollab.button.hairline.borderColor
              : undefined,
          paddingVertical: compact ? 14 : kollab.button.paddingVertical,
          borderRadius: kollab.button.borderRadius,
          opacity: disabled && !loading && !disabledSpec ? 0.5 : 1,
        },
        pressed && !inactive && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
    >
      {loading ? <ActivityIndicator color={fg} size="small" /> : icon}
      <Text
        style={[styles.label, { color: fg, fontSize: compact ? 14 : kollab.type.button.fontSize }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pressed: {
    transform: [{ scale: 0.975 }],
  },
  label: {
    fontFamily: 'InstrumentSans_600SemiBold',
    letterSpacing: -0.2,
  },
});
