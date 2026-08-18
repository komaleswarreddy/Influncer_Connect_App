import React from 'react';
import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useKollab } from '@/theme/kollab-tokens';

export type KollabButtonVariant = 'primary' | 'ink' | 'soft' | 'hairline';

type Props = {
  label: string;
  onPress: () => void;
  variant?: KollabButtonVariant;
  /** Smaller padding/font — the "Ask the AI" / "Share" paired-secondary size in the mockup. */
  compact?: boolean;
  disabled?: boolean;
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
  icon,
  style,
}: Props) {
  const kollab = useKollab();
  const spec = kollab.button[variant];
  const isHairline = variant === 'hairline';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isHairline ? 'transparent' : spec.bg,
          borderWidth: isHairline ? kollab.button.hairline.borderWidth : 0,
          borderColor: isHairline ? kollab.button.hairline.borderColor : undefined,
          paddingVertical: compact ? 14 : kollab.button.paddingVertical,
          borderRadius: kollab.button.borderRadius,
          opacity: disabled ? 0.5 : 1,
        },
        pressed && !disabled && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      {icon}
      <Text
        style={[
          styles.label,
          { color: spec.fg, fontSize: compact ? 14 : kollab.type.button.fontSize },
        ]}
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

export default KollabButton;
